// server/src/lib/jobs/proposalReminderJobs.ts
import { Queue, Worker, type Job } from "bullmq";
import { redisConfig } from "@/config/redis.ts";
import logger from "@/config/logger.ts";
import db from "@/config/db/index.ts";
import {
    phdProposals,
    phdProposalSemesters,
    phdProposalDacReviews,
} from "@/config/db/schema/phd.ts";
import { and, gte, inArray, or, eq, lte } from "drizzle-orm";
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { phdSchemas } from "lib";

const QUEUE_NAME = "proposalReminderQueue";
const SCHEDULER_JOB_NAME = "proposalReminderScheduler"; // Generic name is fine
const REMINDER_SEND_JOB_NAME = "sendSpecificProposalReminder";

// --- EDIT THIS LINE FOR YOUR DESIRED SCHEDULE ---
// Examples:
// '0 */6 * * *'    - Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
// '0 5,11,17,23 * * *' - Every 6 hours starting at 5 AM UTC
// '30 11,23 * * *' - Original 5 AM / 5 PM IST
// '0 * * * *'      - Every hour (for testing - generates many jobs)
// '*/15 * * * *'   - Every 15 minutes (for aggressive testing)
const SCHEDULER_CRON_PATTERN = "*30 11,23 * * *"; // Default: 5 AM / 5 PM IST
// ----------------------------------------------

type ReviewerRole = "supervisor" | "drc" | "dac";
type TargetRole = ReviewerRole | "student";

export const proposalReminderQueue = new Queue(QUEUE_NAME, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 10000 },
        removeOnComplete: { age: 3600 * 24 * 7 },
        removeOnFail: { age: 3600 * 24 * 14 },
    },
});

const REMINDER_INTERVALS = [
    { days: 5, hours: 0, minutes: 0, label: "T-5d" },
    { days: 2, hours: 0, minutes: 0, label: "T-2d" },
    { days: 1, hours: 0, minutes: 0, label: "T-1d" },
    { days: 0, hours: 12, minutes: 0, label: "T-12h" },
    { days: 0, hours: 8, minutes: 0, label: "T-8h" },
    // { days: 0, hours: 3, minutes: 15, label: "T-4h" },
    { days: 0, hours: 3, minutes: 0, label: "T-3h" },
    // { days: 0, hours: 0, minutes: 30, label: "T-30m" },
    { days: 0, hours: 0, minutes: 15, label: "T-15m" },
] as const;

const calculateReminderTime = (
    deadline: Date,
    interval: (typeof REMINDER_INTERVALS)[number]
): Date => {
    const reminderTime = new Date(deadline);
    reminderTime.setDate(reminderTime.getDate() - interval.days);
    reminderTime.setHours(reminderTime.getHours() - interval.hours);
    reminderTime.setMinutes(reminderTime.getMinutes() - interval.minutes);
    return reminderTime;
};

const statusDeadlineMap: Record<
    (typeof phdSchemas.phdProposalStatuses)[number],
    { role: TargetRole; deadlineKey: keyof typeof deadlineColumnMap } | null
> = {
    draft: { role: "student", deadlineKey: "studentSubmissionDate" },
    supervisor_review: { role: "supervisor", deadlineKey: "facultyReviewDate" },
    drc_review: { role: "drc", deadlineKey: "drcReviewDate" },
    dac_review: { role: "dac", deadlineKey: "dacReviewDate" },
    supervisor_revert: {
        role: "student",
        deadlineKey: "studentSubmissionDate",
    },
    drc_revert: { role: "student", deadlineKey: "studentSubmissionDate" },
    dac_revert: { role: "student", deadlineKey: "studentSubmissionDate" },
    dac_accepted: null,
    seminar_pending: null,
    finalising_documents: null,
    completed: null,
    deleted: null,
    rejected: null,
    draft_expired: null,
};

const deadlineColumnMap = {
    studentSubmissionDate: phdProposalSemesters.studentSubmissionDate,
    facultyReviewDate: phdProposalSemesters.facultyReviewDate,
    drcReviewDate: phdProposalSemesters.drcReviewDate,
    dacReviewDate: phdProposalSemesters.dacReviewDate,
} as const;

interface SpecificReminderJobData {
    semesterId: number;
    role: TargetRole;
    deadlineType: keyof typeof deadlineColumnMap;
    deadlineTimestamp: number;
    reminderLabel: string;
}

export const proposalReminderWorker = new Worker(
    QUEUE_NAME,
    async (job: Job<SpecificReminderJobData | unknown, any, string>) => {
        if (job.name === SCHEDULER_JOB_NAME) {
            logger.info(`Running job: ${SCHEDULER_JOB_NAME}`);
            try {
                // Renamed function being called
                await runReminderChecksAndScheduleSpecifics();
                logger.info(`Finished job: ${SCHEDULER_JOB_NAME}`);
            } catch (error) {
                logger.error(`Error during ${SCHEDULER_JOB_NAME}:`, error);
                throw error;
            }
        } else if (job.name === REMINDER_SEND_JOB_NAME) {
            const data = job.data as SpecificReminderJobData;
            logger.info(
                `Running job: ${REMINDER_SEND_JOB_NAME} for ${data.role} - ${data.reminderLabel} (Deadline: ${new Date(data.deadlineTimestamp).toLocaleString()})`
            );
            try {
                const semester = await db.query.phdProposalSemesters.findFirst({
                    where: eq(phdProposalSemesters.id, data.semesterId),
                });
                if (!semester) {
                    logger.warn(
                        `[${REMINDER_SEND_JOB_NAME}] Semester ${data.semesterId} not found. Skipping.`
                    );
                    return;
                }
                const deadlineDate = semester[data.deadlineType];
                if (!deadlineDate || deadlineDate < new Date()) {
                    logger.info(
                        `[${REMINDER_SEND_JOB_NAME}] Deadline for ${data.role} (${data.deadlineType}) has passed or is invalid. Skipping.`
                    );
                    return;
                }

                if (data.role === "student") {
                    await handleStudentReminders(
                        semester,
                        data.deadlineType,
                        data.reminderLabel
                    );
                } else {
                    await handleReviewerReminders(
                        semester,
                        data.role as ReviewerRole,
                        data.deadlineType,
                        data.reminderLabel
                    );
                }
                logger.info(
                    `Finished job: ${REMINDER_SEND_JOB_NAME} for ${data.role} - ${data.reminderLabel}`
                );
            } catch (error) {
                logger.error(
                    `Error during ${REMINDER_SEND_JOB_NAME} for ${data.role} (${data.reminderLabel}):`,
                    error
                );
                throw error;
            }
        } else {
            logger.warn(`Unknown job name in ${QUEUE_NAME}: ${job.name}`);
        }
    },
    { connection: redisConfig, concurrency: 5 }
);

// Function name kept generic
export async function scheduleReminderSchedulerJob() {
    // Use the constant defined above
    const jobKey = `${SCHEDULER_JOB_NAME}:::${SCHEDULER_JOB_NAME}::pattern:${SCHEDULER_CRON_PATTERN}`;
    try {
        const repeatableJobs = await proposalReminderQueue.getRepeatableJobs();
        const existingJob = repeatableJobs.find((j) => j.key === jobKey);
        if (existingJob) {
            await proposalReminderQueue.removeRepeatableByKey(jobKey);
            logger.info(`Removed existing repeatable job with key: ${jobKey}`);
        }
    } catch (error) {
        logger.warn(
            `Could not remove repeatable job (may not exist): ${jobKey}`,
            error
        );
    }

    await proposalReminderQueue.add(
        SCHEDULER_JOB_NAME,
        {},
        {
            repeat: { pattern: SCHEDULER_CRON_PATTERN }, // Use the constant
            jobId: SCHEDULER_JOB_NAME,
            removeOnComplete: true,
            removeOnFail: { age: 3600 * 24 * 7 },
        }
    );
    logger.info(
        `Scheduled repeatable job: ${SCHEDULER_JOB_NAME} with pattern "${SCHEDULER_CRON_PATTERN}"`
    );
}

// Renamed function to reflect its action
async function runReminderChecksAndScheduleSpecifics() {
    logger.info(
        `[${SCHEDULER_JOB_NAME}] Starting checks to schedule specific reminders.`
    );
    const now = new Date();
    const checkEndDate = new Date(now);
    checkEndDate.setDate(checkEndDate.getDate() + 7);

    const relevantSemesters = await db.query.phdProposalSemesters.findMany({
        where: or(
            and(
                gte(phdProposalSemesters.studentSubmissionDate, now),
                lte(phdProposalSemesters.studentSubmissionDate, checkEndDate)
            ),
            and(
                gte(phdProposalSemesters.facultyReviewDate, now),
                lte(phdProposalSemesters.facultyReviewDate, checkEndDate)
            ),
            and(
                gte(phdProposalSemesters.drcReviewDate, now),
                lte(phdProposalSemesters.drcReviewDate, checkEndDate)
            ),
            and(
                gte(phdProposalSemesters.dacReviewDate, now),
                lte(phdProposalSemesters.dacReviewDate, checkEndDate)
            )
        ),
    });

    if (relevantSemesters.length === 0) {
        logger.info(
            `[${SCHEDULER_JOB_NAME}] No relevant upcoming deadlines found within the next 7 days.`
        );
        return;
    }

    logger.info(
        `[${SCHEDULER_JOB_NAME}] Found ${relevantSemesters.length} semesters with upcoming deadlines. Scheduling specific reminders...`
    );
    let scheduledCount = 0;

    for (const semester of relevantSemesters) {
        for (const deadlineKeyStr of Object.keys(deadlineColumnMap)) {
            const deadlineKey =
                deadlineKeyStr as keyof typeof deadlineColumnMap;
            const deadlineDate = semester[deadlineKey];
            if (!deadlineDate || deadlineDate < now) continue;

            const targetInfo = Object.values(statusDeadlineMap).find(
                (v) => v?.deadlineKey === deadlineKey
            );
            if (!targetInfo) continue;
            const targetRole = targetInfo.role;

            for (const interval of REMINDER_INTERVALS) {
                const reminderTime = calculateReminderTime(
                    deadlineDate,
                    interval
                );
                const delay = reminderTime.getTime() - now.getTime();

                if (delay > 0) {
                    const deadlineTimestamp = deadlineDate.getTime();
                    const jobId = `${REMINDER_SEND_JOB_NAME}-${semester.id}-${targetRole}-${deadlineKey}-${interval.label}`;
                    const jobData: SpecificReminderJobData = {
                        semesterId: semester.id,
                        role: targetRole,
                        deadlineType: deadlineKey,
                        deadlineTimestamp,
                        reminderLabel: interval.label,
                    };

                    await proposalReminderQueue.add(
                        REMINDER_SEND_JOB_NAME,
                        jobData,
                        {
                            delay,
                            jobId,
                            removeOnComplete: { age: 3600 * 24 },
                            removeOnFail: { age: 3600 * 24 * 7 },
                        }
                    );
                    scheduledCount++;
                }
            }
        }
    }
    logger.info(
        `[${SCHEDULER_JOB_NAME}] Finished scheduling potentially ${scheduledCount} specific reminder jobs.`
    );
}

// --- Functions to HANDLE the specific reminder job (sending emails) ---
// handleStudentReminders and handleReviewerReminders remain unchanged from the previous correct version...
async function handleStudentReminders(
    semester: typeof phdProposalSemesters.$inferSelect,
    deadlineType: keyof typeof deadlineColumnMap,
    reminderLabel: string
) {
    const deadline = new Date(semester[deadlineType]);
    logger.info(
        `[${REMINDER_SEND_JOB_NAME}] Sending student reminders (${reminderLabel}) for deadline: ${deadline.toLocaleString()}`
    );

    const relevantStatuses: (typeof phdSchemas.phdProposalStatuses)[number][] =
        ["draft"];
    if (deadlineType === "studentSubmissionDate") {
        relevantStatuses.push("supervisor_revert", "drc_revert", "dac_revert");
    }

    const proposalsToRemind = await db.query.phdProposals.findMany({
        where: and(
            eq(phdProposals.proposalSemesterId, semester.id),
            inArray(phdProposals.status, relevantStatuses)
        ),
        columns: { studentEmail: true, id: true },
        with: { student: { columns: { name: true } } },
    });

    if (proposalsToRemind.length === 0) {
        logger.info(
            `[${REMINDER_SEND_JOB_NAME}] No student proposals found needing reminder (${reminderLabel}) for deadline ${deadline.toLocaleDateString()}.`
        );
        return;
    }

    const emailsToSend = proposalsToRemind.map((p) => ({
        to: p.studentEmail,
        subject: `Reminder (${reminderLabel}): PhD Proposal Action Needed`,
        text: `This is a reminder regarding your PhD proposal. Action is required before the deadline on ${deadline.toLocaleString()}.\n\nPlease ensure your proposal is submitted or resubmitted as needed.\n\nView Proposal: ${environment.FRONTEND_URL}/phd/phd-student/proposals/${p.id}`,
    }));

    try {
        await sendBulkEmails(emailsToSend);
        logger.info(
            `[${REMINDER_SEND_JOB_NAME}] Sent ${emailsToSend.length} reminder emails to students (${reminderLabel}) for deadline ${deadline.toLocaleDateString()}.`
        );
    } catch (error) {
        logger.error(
            `[${REMINDER_SEND_JOB_NAME}] Failed to send student reminder emails (${reminderLabel}) for semester ${semester.id}:`,
            error
        );
    }
}

async function handleReviewerReminders(
    semester: typeof phdProposalSemesters.$inferSelect,
    role: ReviewerRole,
    _deadlineType: keyof typeof deadlineColumnMap, // Prefix indicates it's intentionally not used directly in logic here
    reminderLabel: string
) {
    let reviewStatus: (typeof phdSchemas.phdProposalStatuses)[number];
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
            logger.error(`[${REMINDER_SEND_JOB_NAME}] Invalid role: ${role}`);
            return;
    }

    logger.info(
        `[${REMINDER_SEND_JOB_NAME}] Sending ${role} reminders (${reminderLabel}) for deadline: ${deadline.toLocaleString()}`
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
            `[${REMINDER_SEND_JOB_NAME}] No proposals found awaiting ${role} review (${reminderLabel}) for deadline ${deadline.toLocaleDateString()}.`
        );
        return;
    }

    const tasksByReviewer = new Map<
        string,
        { studentName: string; proposalId: number }[]
    >();
    let drcConvenersCache: { email: string }[] | null = null;

    for (const proposal of proposalsForReview) {
        const studentName = proposal.student.name || "A student";
        let reviewersToNotify: string[] = [];

        switch (role) {
            case "supervisor":
                if (proposal.supervisorEmail)
                    reviewersToNotify.push(proposal.supervisorEmail);
                else
                    logger.warn(
                        `[${REMINDER_SEND_JOB_NAME}] Proposal ${proposal.id} missing supervisorEmail.`
                    );
                break;
            case "drc":
                if (drcConvenersCache === null)
                    drcConvenersCache =
                        await getUsersWithPermission("phd:drc:proposal");
                reviewersToNotify =
                    drcConvenersCache?.map((drc) => drc.email) ?? [];
                if (reviewersToNotify.length === 0)
                    logger.warn(
                        `[${REMINDER_SEND_JOB_NAME}] No DRC convenors found.`
                    );
                break;
            case "dac":
                const dacProposal = proposal as typeof proposal & {
                    dacMembers?: { dacMemberEmail: string }[];
                };
                if (
                    dacProposal.dacMembers &&
                    dacProposal.dacMembers.length > 0
                ) {
                    const assignedDacEmails = dacProposal.dacMembers.map(
                        (m) => m.dacMemberEmail
                    );
                    const reviewsSubmitted = await db
                        .select({
                            dacMemberEmail:
                                phdProposalDacReviews.dacMemberEmail,
                        })
                        .from(phdProposalDacReviews)
                        .where(
                            and(
                                eq(
                                    phdProposalDacReviews.proposalId,
                                    proposal.id
                                ),
                                inArray(
                                    phdProposalDacReviews.dacMemberEmail,
                                    assignedDacEmails
                                )
                            )
                        );
                    const reviewedEmails = new Set(
                        reviewsSubmitted.map((r) => r.dacMemberEmail)
                    );
                    reviewersToNotify = assignedDacEmails.filter(
                        (email) => !reviewedEmails.has(email)
                    );
                    if (reviewersToNotify.length === 0)
                        logger.info(
                            `[${REMINDER_SEND_JOB_NAME}] All DAC members reviewed proposal ${proposal.id}.`
                        );
                } else {
                    logger.warn(
                        `[${REMINDER_SEND_JOB_NAME}] Proposal ${proposal.id} in dac_review has no DAC members.`
                    );
                }
                break;
        }

        for (const reviewerEmail of reviewersToNotify) {
            if (!tasksByReviewer.has(reviewerEmail))
                tasksByReviewer.set(reviewerEmail, []);
            tasksByReviewer
                .get(reviewerEmail)!
                .push({ studentName, proposalId: proposal.id });
        }
    }

    if (tasksByReviewer.size === 0) {
        logger.info(
            `[${REMINDER_SEND_JOB_NAME}] No ${role}s found needing reminders (${reminderLabel}) for deadline ${deadline.toLocaleDateString()}.`
        );
        return;
    }

    const emailsToSend = Array.from(tasksByReviewer.entries()).map(
        ([reviewerEmail, tasks]) => {
            const taskList = tasks
                .map((task) => `- ${task.studentName} (ID: ${task.proposalId})`)
                .join("\n");
            const firstProposalId = tasks[0].proposalId;
            const link = `${environment.FRONTEND_URL}${linkPath}${firstProposalId}`;
            const subject = `Reminder (${reminderLabel}): PhD Proposal Reviews Due Soon`;
            const body = `This is a reminder that action is required on one or more PhD proposals by ${deadline.toLocaleString()}.\n\nPending Tasks:\n${taskList}\n\nPlease log in to the portal to take action:\n${link}\n\nThank you.`;
            return { to: reviewerEmail, subject, text: body };
        }
    );

    try {
        await sendBulkEmails(emailsToSend);
        logger.info(
            `[${REMINDER_SEND_JOB_NAME}] Sent ${emailsToSend.length} reminder emails to ${role}s (${reminderLabel}) for deadline ${deadline.toLocaleDateString()}.`
        );
    } catch (error) {
        logger.error(
            `[${REMINDER_SEND_JOB_NAME}] Failed to send ${role} reminder emails (${reminderLabel}) for deadline ${deadline.toLocaleDateString()}:`,
            error
        );
    }
}

proposalReminderWorker.on("failed", (job, err) => {
    logger.error(
        `[${QUEUE_NAME}] Job ${job?.id}(${job?.name}) failed: ${err.message}`,
        err
    );
});
proposalReminderWorker.on("error", (err) => {
    logger.error(`[${QUEUE_NAME}] Worker error: ${err.message}`, err);
});

// scheduleReminderSchedulerJob(); // Call this once on application start
