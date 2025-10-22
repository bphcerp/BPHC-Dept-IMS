import { Queue, Worker, type Job } from "bullmq";
import { redisConfig } from "@/config/redis.ts";
import logger from "@/config/logger.ts";
import db from "@/config/db/index.ts";
import { phdProposals, phdProposalSemesters } from "@/config/db/schema/phd.ts";
import { and, gte, inArray, or, sql, eq } from "drizzle-orm";
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";
import { getUsersWithPermission } from "@/lib/common/index.ts";

const QUEUE_NAME = "proposalReminderQueue";
const JOB_NAME = "dailyProposalReminderCheck";
const REMINDER_DAYS = [1, 2, 5];

export const proposalReminderQueue = new Queue(QUEUE_NAME, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 10000 },
        removeOnComplete: { age: 3600 * 24 * 7 },
        removeOnFail: { age: 3600 * 24 * 14 },
    },
});

export const proposalReminderWorker = new Worker(
    QUEUE_NAME,
    async (job: Job<unknown, any, string>) => {
        if (job.name === JOB_NAME) {
            logger.info(`Running job: ${JOB_NAME}`);
            try {
                await runReminderChecks();
                logger.info(`Finished job: ${JOB_NAME}`);
            } catch (error) {
                logger.error(`Error during ${JOB_NAME}:`, error);
                throw error;
            }
        } else {
            logger.warn(`Unknown job name in ${QUEUE_NAME}: ${job.name}`);
        }
    },
    { connection: redisConfig, concurrency: 1 }
);

export async function scheduleDailyProposalReminders() {
    await proposalReminderQueue.removeRepeatableByKey(
        `${JOB_NAME}:::${JOB_NAME}::*` 
    );

    await proposalReminderQueue.add(
        JOB_NAME,
        {},
        {
            repeat: {
                pattern: "0 3 * * *", 
            },
            jobId: JOB_NAME,
            removeOnComplete: true,
            removeOnFail: { age: 3600 * 24 * 7 },
        }
    );
    logger.info(
        `Scheduled repeatable job: ${JOB_NAME} with pattern "0 3 * * *"`
    );
}

function getReminderTargetDates(now: Date): Date[] {
    return REMINDER_DAYS.map((days) => {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + days);
        targetDate.setHours(0, 0, 0, 0);
        return targetDate;
    });
}

async function handleStudentReminders(
    semester: typeof phdProposalSemesters.$inferSelect
) {
    const deadline = new Date(
        semester.studentSubmissionDate
    ).toLocaleDateString();
    logger.info(
        `[${JOB_NAME}] Processing student reminders for deadline: ${deadline}`
    );
    const draftProposals = await db.query.phdProposals.findMany({
        where: and(
            eq(phdProposals.proposalSemesterId, semester.id),
            eq(phdProposals.status, "draft")
        ),
        columns: {
            studentEmail: true,
        },
    });

    if (draftProposals.length === 0) {
        logger.info(
            `[${JOB_NAME}] No student proposal drafts found for deadline ${deadline}.`
        );
        return;
    }

    const studentEmails = draftProposals.map((p) => p.studentEmail);

    const emailsToSend = studentEmails.map((email) => ({
        to: email,
        subject: "Reminder: PhD Proposal Submission Deadline Approaching",
        text: `This is a reminder that your PhD proposal is due on ${deadline}. Please ensure you submit it on the portal before the deadline. Link: ${environment.FRONTEND_URL}/phd/phd-student/proposals`,
    }));

    try {
        await sendBulkEmails(emailsToSend);
        logger.info(
            `[${JOB_NAME}] Sent ${emailsToSend.length} reminder emails to students for deadline ${deadline}.`
        );
    } catch (error) {
        logger.error(
            `[${JOB_NAME}] Failed to send student reminder emails for semester ${semester.id}:`,
            error
        );
    }
}

type ReviewerRole = "supervisor" | "drc" | "dac";

async function handleReviewerReminders(
    semester: typeof phdProposalSemesters.$inferSelect,
    role: ReviewerRole
) {
    let reviewStatus: (typeof phdProposals.$inferSelect)["status"];
    let deadline: Date;
    let linkPath: string;

    switch (role) {
        case "supervisor":
            reviewStatus = "supervisor_review";
            deadline = semester.facultyReviewDate;
            linkPath = "/phd/supervisor/proposal/";
            break;
        case "drc":
            reviewStatus = "drc_review";
            deadline = semester.drcReviewDate;
            linkPath = "/phd/drc-convenor/proposal-management/";
            break;
        case "dac":
            reviewStatus = "dac_review";
            deadline = semester.dacReviewDate;
            linkPath = "/phd/dac/proposals/";
            break;
    }

    const deadlineStr = new Date(deadline).toLocaleDateString();
    logger.info(
        `[${JOB_NAME}] Processing ${role} reminders for deadline: ${deadlineStr}`
    );

    const proposalsForReview = await db.query.phdProposals.findMany({
        where: and(
            eq(phdProposals.proposalSemesterId, semester.id),
            eq(phdProposals.status, reviewStatus)
        ),
        with: {
            student: { columns: { name: true } },
            ...(role === "dac" && {
                dacMembers: { columns: { dacMemberEmail: true } },
            }),
        },
        columns: {
            id: true,
            supervisorEmail: true,
        },
    });

    if (proposalsForReview.length === 0) {
        logger.info(
            `[${JOB_NAME}] No proposals found awaiting ${role} review for deadline ${deadlineStr}.`
        );
        return;
    }

    const tasksByReviewer = new Map<
        string,
        { studentName: string; proposalId: number }[]
    >();
    let drcConveners: { email: string }[] | null = null;

    for (const proposal of proposalsForReview) {
        const studentName = proposal.student.name || "A student";
        let reviewersToNotify: string[] = [];

        switch (role) {
            case "supervisor":
                if (proposal.supervisorEmail) {
                    reviewersToNotify.push(proposal.supervisorEmail);
                } else {
                    logger.warn(
                        `[${JOB_NAME}] Proposal ${proposal.id} is in supervisor_review but has no supervisorEmail.`
                    );
                }
                break;
            case "drc":
                if (drcConveners === null) {
                    drcConveners =
                        await getUsersWithPermission("phd:drc:proposal");
                    if (drcConveners.length === 0) {
                        logger.warn(
                            "[${JOB_NAME}] DRC reminders needed, but no users found with 'phd:drc:proposal' permission."
                        );
                    }
                }
                reviewersToNotify = drcConveners?.map((drc) => drc.email) ?? [];
                break;
            case "dac":
                const dacProposal = proposal as typeof proposal & {
                    dacMembers?: { dacMemberEmail: string }[];
                };
                if (
                    dacProposal.dacMembers &&
                    dacProposal.dacMembers.length > 0
                ) {
                    reviewersToNotify = dacProposal.dacMembers.map(
                        (m) => m.dacMemberEmail
                    );
                } else {
                    logger.warn(
                        `[${JOB_NAME}] Proposal ${proposal.id} is in dac_review but has no DAC members assigned.`
                    );
                }
                break;
        }

        for (const reviewerEmail of reviewersToNotify) {
            if (!tasksByReviewer.has(reviewerEmail)) {
                tasksByReviewer.set(reviewerEmail, []);
            }
            tasksByReviewer
                .get(reviewerEmail)!
                .push({ studentName, proposalId: proposal.id });
        }
    }

    if (tasksByReviewer.size === 0) {
        logger.info(
            `[${JOB_NAME}] No reviewers found needing reminders for ${role} on deadline ${deadlineStr}.`
        );
        return;
    }

    const emailsToSend = Array.from(tasksByReviewer.entries()).map(
        ([reviewerEmail, tasks]) => {
            const taskList = tasks
                .map(
                    (task) =>
                        `- ${task.studentName} (View at: ${environment.FRONTEND_URL}${linkPath}${task.proposalId})`
                )
                .join("\n");

            const subject = `Reminder: PhD Proposal Reviews Due Soon`;
            const body = `This is a reminder that you have pending proposal reviews due on ${deadlineStr}.\n\nPlease review the following proposals:\n\n${taskList}\n\nThank you.`;

            return { to: reviewerEmail, subject, body };
        }
    );

    try {
        await sendBulkEmails(emailsToSend);
        logger.info(
            `[${JOB_NAME}] Sent ${emailsToSend.length} reminder emails to ${role}s for deadline ${deadlineStr}.`
        );
    } catch (error) {
        logger.error(
            `[${JOB_NAME}] Failed to send ${role} reminder emails for deadline ${deadlineStr}:`,
            error
        );
    }
}

async function runReminderChecks() {
    logger.info(`[${JOB_NAME}] Starting reminder checks.`);
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminderDates = getReminderTargetDates(now);

    const upcomingSemesters = await db
        .select()
        .from(phdProposalSemesters)
        .where(
            and(
                or(
                    inArray(
                        sql`DATE(${phdProposalSemesters.studentSubmissionDate})`,
                        reminderDates
                    ),
                    inArray(
                        sql`DATE(${phdProposalSemesters.facultyReviewDate})`,
                        reminderDates
                    ),
                    inArray(
                        sql`DATE(${phdProposalSemesters.drcReviewDate})`,
                        reminderDates
                    ),
                    inArray(
                        sql`DATE(${phdProposalSemesters.dacReviewDate})`,
                        reminderDates
                    )
                ),
                gte(phdProposalSemesters.dacReviewDate, today)
            )
        );

    if (upcomingSemesters.length === 0) {
        logger.info(
            `[${JOB_NAME}] No upcoming proposal deadlines match reminder schedule.`
        );
        return;
    }
    logger.info(
        `[${JOB_NAME}] Found ${upcomingSemesters.length} semester cycles matching reminder schedule.`
    );

    for (const semester of upcomingSemesters) {
        const checkDate = (date: Date) =>
            reminderDates.some(
                (rd) => new Date(date).setHours(0, 0, 0, 0) === rd.getTime()
            );

        if (checkDate(semester.studentSubmissionDate)) {
            await handleStudentReminders(semester);
        }
        if (checkDate(semester.facultyReviewDate)) {
            await handleReviewerReminders(semester, "supervisor");
        }
        if (checkDate(semester.drcReviewDate)) {
            await handleReviewerReminders(semester, "drc");
        }
        if (checkDate(semester.dacReviewDate)) {
            await handleReviewerReminders(semester, "dac");
        }
    }
    logger.info(
        `[${JOB_NAME}] Finished processing reminders for upcoming deadlines.`
    );
}

proposalReminderWorker.on("failed", (job, err) => {
    logger.error(
        `[${QUEUE_NAME}] Job ${job?.id} (${job?.name}) failed with error: ${err.message}`,
        err
    );
});
proposalReminderWorker.on("error", (err) => {
    logger.error(
        `[${QUEUE_NAME}] Worker encountered an error: ${err.message}`,
        err
    );
});
