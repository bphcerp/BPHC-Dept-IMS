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
const DAILY_CHECK_JOB_NAME = "dailyProposalReminderCheck";
const SPECIFIC_REMINDER_JOB_NAME = "specificProposalReminder";

const DAILY_REMINDER_DAYS = [1, 2, 5];
const HOURLY_REMINDER_TIMES_BEFORE = [
    { hours: 12, minutes: 0 },
    { hours: 8, minutes: 0 },
    { hours: 7, minutes: 0 },
    { hours: 6, minutes: 0 },
    { hours: 4, minutes: 0 },
    { hours: 2, minutes: 0 },
    { hours: 1, minutes: 0 },
    { hours: 0, minutes: 30 },
    { hours: 0, minutes: 15 },
];

type ReviewerRole = "supervisor" | "drc" | "dac";

export const proposalReminderQueue = new Queue(QUEUE_NAME, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 10000 },
        removeOnComplete: { age: 3600 * 24 * 7 },
        removeOnFail: { age: 3600 * 24 * 14 },
    },
});

interface SpecificReminderJobData {
    semesterId: number;
    role: ReviewerRole | "student";
    deadlineType: keyof typeof deadlineColumnMap;
    deadlineTimestamp: number;
    reminderLabel: string;
}

const deadlineColumnMap = {
    studentSubmissionDate: phdProposalSemesters.studentSubmissionDate,
    facultyReviewDate: phdProposalSemesters.facultyReviewDate,
    drcReviewDate: phdProposalSemesters.drcReviewDate,
    dacReviewDate: phdProposalSemesters.dacReviewDate,
} as const;

export const proposalReminderWorker = new Worker(
    QUEUE_NAME,
    async (job: Job<SpecificReminderJobData | unknown, any, string>) => {
        if (job.name === DAILY_CHECK_JOB_NAME) {
            logger.info(`Running job: ${DAILY_CHECK_JOB_NAME}`);
            try {
                await runDailyReminderChecksAndScheduleSpecifics();
                logger.info(`Finished job: ${DAILY_CHECK_JOB_NAME}`);
            } catch (error) {
                logger.error(`Error during ${DAILY_CHECK_JOB_NAME}:`, error);
                throw error;
            }
        } else if (job.name === SPECIFIC_REMINDER_JOB_NAME) {
            const data = job.data as SpecificReminderJobData;
            logger.info(
                `Running job: ${SPECIFIC_REMINDER_JOB_NAME} for ${data.role} - ${data.reminderLabel} (Deadline: ${new Date(data.deadlineTimestamp).toLocaleString()})`
            );
            try {
                const semester = await db.query.phdProposalSemesters.findFirst({
                    where: eq(phdProposalSemesters.id, data.semesterId),
                });
                if (!semester) {
                    logger.warn(
                        `[${SPECIFIC_REMINDER_JOB_NAME}] Semester ${data.semesterId} not found. Skipping.`
                    );
                    return;
                }
                if (new Date(data.deadlineTimestamp) < new Date()) {
                    logger.info(
                        `[${SPECIFIC_REMINDER_JOB_NAME}] Deadline for ${data.role} (${data.deadlineType}) has already passed. Skipping.`
                    );
                    return;
                }

                if (data.role === "student") {
                    await handleStudentReminders(semester, true);
                } else {
                    await handleReviewerReminders(
                        semester,
                        data.role as ReviewerRole,
                        true
                    );
                }
                logger.info(
                    `Finished job: ${SPECIFIC_REMINDER_JOB_NAME} for ${data.role} - ${data.reminderLabel}`
                );
            } catch (error) {
                logger.error(
                    `Error during ${SPECIFIC_REMINDER_JOB_NAME} for ${data.role} (${data.reminderLabel}):`,
                    error
                );
                throw error;
            }
        } else {
            logger.warn(`Unknown job name in ${QUEUE_NAME}: ${job.name}`);
        }
    },
    { connection: redisConfig, concurrency: 1 }
);

export async function scheduleDailyProposalReminders() {
    const jobKey = `${DAILY_CHECK_JOB_NAME}:::${DAILY_CHECK_JOB_NAME}::pattern:0 5,17 * * *`;
    try {
        await proposalReminderQueue.removeRepeatableByKey(jobKey);
        logger.info(`Removed existing repeatable job with key: ${jobKey}`);
    } catch (error) {
        logger.warn(
            `Could not remove repeatable job (may not exist): ${jobKey}`,
            error
        );
    }

    await proposalReminderQueue.add(
        DAILY_CHECK_JOB_NAME,
        {},
        {
            repeat: {
                pattern: "0 5,17 * * *",
            },
            jobId: DAILY_CHECK_JOB_NAME,
            removeOnComplete: true,
            removeOnFail: { age: 3600 * 24 * 7 },
        }
    );
    logger.info(
        `Scheduled repeatable job: ${DAILY_CHECK_JOB_NAME} with pattern "0 5,17 * * *"`
    );
}

async function scheduleHourlyReminders(
    semester: typeof phdProposalSemesters.$inferSelect,
    role: ReviewerRole | "student",
    deadlineType: keyof typeof deadlineColumnMap,
    deadlineDate: Date
) {
    const deadlineTimestamp = deadlineDate.getTime();
    logger.info(
        `[${DAILY_CHECK_JOB_NAME}] Scheduling specific reminders for ${role}, deadline ${deadlineDate.toLocaleString()} (Type: ${deadlineType})`
    );

    for (const reminderTime of HOURLY_REMINDER_TIMES_BEFORE) {
        const reminderTimestamp =
            deadlineTimestamp -
            reminderTime.hours * 60 * 60 * 1000 -
            reminderTime.minutes * 60 * 1000;
        const delay = reminderTimestamp - Date.now();
        const reminderLabel = `T-${reminderTime.hours}h${reminderTime.minutes}m`;

        if (delay > 0) {
            const jobId = `${SPECIFIC_REMINDER_JOB_NAME}-${semester.id}-${role}-${deadlineType}-${reminderLabel}`;
            const jobData: SpecificReminderJobData = {
                semesterId: semester.id,
                role,
                deadlineType,
                deadlineTimestamp,
                reminderLabel,
            };

            await proposalReminderQueue.add(
                SPECIFIC_REMINDER_JOB_NAME,
                jobData,
                {
                    delay,
                    jobId,
                    removeOnComplete: { age: 3600 * 24 },
                    removeOnFail: { age: 3600 * 24 * 7 },
                }
            );
        }
    }
}

function getDailyReminderTargetDates(now: Date): Date[] {
    return DAILY_REMINDER_DAYS.map((days) => {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + days);
        targetDate.setHours(0, 0, 0, 0);
        return targetDate;
    });
}

async function handleStudentReminders(
    semester: typeof phdProposalSemesters.$inferSelect,
    isSpecificReminder: boolean = false
) {
    const deadline = new Date(semester.studentSubmissionDate);
    const deadlineStr = deadline.toLocaleDateString();
    const jobType = isSpecificReminder
        ? SPECIFIC_REMINDER_JOB_NAME
        : DAILY_CHECK_JOB_NAME;
    logger.info(
        `[${jobType}] Processing student reminders for deadline: ${deadlineStr}`
    );

    const draftProposals = await db.query.phdProposals.findMany({
        where: and(
            eq(phdProposals.proposalSemesterId, semester.id),
            eq(phdProposals.status, "draft")
        ),
        columns: { studentEmail: true },
    });

    if (draftProposals.length === 0) {
        logger.info(
            `[${jobType}] No student proposal drafts found needing reminder for deadline ${deadlineStr}.`
        );
        return;
    }

    const studentEmails = draftProposals.map((p) => p.studentEmail);
    const emailsToSend = studentEmails.map((email) => ({
        to: email,
        subject: "Reminder: PhD Proposal Submission Deadline Approaching",
        text: `This is a reminder that your PhD proposal is due on ${deadline.toLocaleString()}. Please ensure you submit it on the portal before the deadline. Link: ${environment.FRONTEND_URL}/phd/phd-student/proposals`,
    }));

    try {
        await sendBulkEmails(emailsToSend);
        logger.info(
            `[${jobType}] Sent ${emailsToSend.length} reminder emails to students for deadline ${deadlineStr}.`
        );
    } catch (error) {
        logger.error(
            `[${jobType}] Failed to send student reminder emails for semester ${semester.id}:`,
            error
        );
    }
}

async function handleReviewerReminders(
    semester: typeof phdProposalSemesters.$inferSelect,
    role: ReviewerRole,
    isSpecificReminder: boolean = false
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
        default:
            logger.error(
                `[${isSpecificReminder ? SPECIFIC_REMINDER_JOB_NAME : DAILY_CHECK_JOB_NAME}] Invalid role passed to handleReviewerReminders: ${role}`
            );
            return;
    }

    const deadlineStr = deadline.toLocaleDateString();
    const jobType = isSpecificReminder
        ? SPECIFIC_REMINDER_JOB_NAME
        : DAILY_CHECK_JOB_NAME;
    logger.info(
        `[${jobType}] Processing ${role} reminders for deadline: ${deadlineStr}`
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
        columns: { id: true, supervisorEmail: true },
    });

    if (proposalsForReview.length === 0) {
        logger.info(
            `[${jobType}] No proposals found awaiting ${role} review for deadline ${deadlineStr}.`
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
                        `[${jobType}] Proposal ${proposal.id} is in supervisor_review but has no supervisorEmail.`
                    );
                }
                break;
            case "drc":
                if (drcConveners === null) {
                    drcConveners =
                        await getUsersWithPermission("phd:drc:proposal");
                    if (drcConveners.length === 0) {
                        logger.warn(
                            `[${jobType}] DRC reminders needed, but no users found with 'phd:drc:proposal' permission.`
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
                        `[${jobType}] Proposal ${proposal.id} is in dac_review but has no DAC members assigned.`
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
            `[${jobType}] No reviewers found needing reminders for ${role} on deadline ${deadlineStr}.`
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
            const body = `This is a reminder that you have pending proposal reviews due on ${deadline.toLocaleString()}.\n\nPlease review the following proposals:\n\n${taskList}\n\nThank you.`;
            return { to: reviewerEmail, subject, body };
        }
    );

    try {
        await sendBulkEmails(emailsToSend);
        logger.info(
            `[${jobType}] Sent ${emailsToSend.length} reminder emails to ${role}s for deadline ${deadlineStr}.`
        );
    } catch (error) {
        logger.error(
            `[${jobType}] Failed to send ${role} reminder emails for deadline ${deadlineStr}:`,
            error
        );
    }
}

async function runDailyReminderChecksAndScheduleSpecifics() {
    logger.info(`[${DAILY_CHECK_JOB_NAME}] Starting daily reminder checks.`);
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyReminderTargetDates = getDailyReminderTargetDates(now);

    const upcomingSemesters = await db
        .select()
        .from(phdProposalSemesters)
        .where(
            and(
                or(
                    inArray(
                        sql`DATE(${phdProposalSemesters.studentSubmissionDate})`,
                        dailyReminderTargetDates
                    ),
                    inArray(
                        sql`DATE(${phdProposalSemesters.facultyReviewDate})`,
                        dailyReminderTargetDates
                    ),
                    inArray(
                        sql`DATE(${phdProposalSemesters.drcReviewDate})`,
                        dailyReminderTargetDates
                    ),
                    inArray(
                        sql`DATE(${phdProposalSemesters.dacReviewDate})`,
                        dailyReminderTargetDates
                    )
                ),
                gte(phdProposalSemesters.dacReviewDate, today)
            )
        );

    if (upcomingSemesters.length === 0) {
        logger.info(
            `[${DAILY_CHECK_JOB_NAME}] No upcoming proposal deadlines match daily reminder schedule.`
        );
    } else {
        logger.info(
            `[${DAILY_CHECK_JOB_NAME}] Found ${upcomingSemesters.length} semester cycles matching daily reminder schedule.`
        );
        for (const semester of upcomingSemesters) {
            const checkDailyDate = (date: Date) =>
                dailyReminderTargetDates.some(
                    (rd) => new Date(date).setHours(0, 0, 0, 0) === rd.getTime()
                );

            if (checkDailyDate(semester.studentSubmissionDate)) {
                await handleStudentReminders(semester);
            }
            if (checkDailyDate(semester.facultyReviewDate)) {
                await handleReviewerReminders(semester, "supervisor");
            }
            if (checkDailyDate(semester.drcReviewDate)) {
                await handleReviewerReminders(semester, "drc");
            }
            if (checkDailyDate(semester.dacReviewDate)) {
                await handleReviewerReminders(semester, "dac");
            }
        }
    }

    const oneDayFromNowTarget = new Date(now);
    oneDayFromNowTarget.setDate(oneDayFromNowTarget.getDate() + 1);
    oneDayFromNowTarget.setHours(0, 0, 0, 0);

    const semestersForSpecificScheduling = await db
        .select()
        .from(phdProposalSemesters)
        .where(
            and(
                or(
                    sql`DATE(${phdProposalSemesters.studentSubmissionDate}) = ${oneDayFromNowTarget}`,
                    sql`DATE(${phdProposalSemesters.facultyReviewDate}) = ${oneDayFromNowTarget}`,
                    sql`DATE(${phdProposalSemesters.drcReviewDate}) = ${oneDayFromNowTarget}`,
                    sql`DATE(${phdProposalSemesters.dacReviewDate}) = ${oneDayFromNowTarget}`
                ),
                gte(phdProposalSemesters.dacReviewDate, today)
            )
        );

    if (semestersForSpecificScheduling.length > 0) {
        logger.info(
            `[${DAILY_CHECK_JOB_NAME}] Found ${semestersForSpecificScheduling.length} semester cycles needing specific reminder scheduling for tomorrow.`
        );
        for (const semester of semestersForSpecificScheduling) {
            const checkIsTomorrow = (date: Date) =>
                new Date(date).setHours(0, 0, 0, 0) ===
                oneDayFromNowTarget.getTime();

            if (checkIsTomorrow(semester.studentSubmissionDate)) {
                await scheduleHourlyReminders(
                    semester,
                    "student",
                    "studentSubmissionDate",
                    semester.studentSubmissionDate
                );
            }
            if (checkIsTomorrow(semester.facultyReviewDate)) {
                await scheduleHourlyReminders(
                    semester,
                    "supervisor",
                    "facultyReviewDate",
                    semester.facultyReviewDate
                );
            }
            if (checkIsTomorrow(semester.drcReviewDate)) {
                await scheduleHourlyReminders(
                    semester,
                    "drc",
                    "drcReviewDate",
                    semester.drcReviewDate
                );
            }
            if (checkIsTomorrow(semester.dacReviewDate)) {
                await scheduleHourlyReminders(
                    semester,
                    "dac",
                    "dacReviewDate",
                    semester.dacReviewDate
                );
            }
        }
    } else {
        logger.info(
            `[${DAILY_CHECK_JOB_NAME}] No deadlines found for tomorrow requiring specific reminder scheduling.`
        );
    }

    logger.info(
        `[${DAILY_CHECK_JOB_NAME}] Finished daily checks and specific scheduling.`
    );
}

proposalReminderWorker.on("failed", (job, err) => {
    logger.error(
        `[${QUEUE_NAME}] Job ${job?.id} (${job?.name}) failed: ${err.message}`,
        err
    );
});
proposalReminderWorker.on("error", (err) => {
    logger.error(`[${QUEUE_NAME}] Worker error: ${err.message}`, err);
});
