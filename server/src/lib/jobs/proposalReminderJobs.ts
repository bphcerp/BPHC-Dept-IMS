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
import { phdSchemas } from "lib"; // Assuming phdSchemas contains the statuses

const QUEUE_NAME = "proposalReminderQueue";
// Keep job name for the scheduler
const SCHEDULER_JOB_NAME = "twiceDailyProposalReminderScheduler";
// Add job name for the actual reminder sending task
const REMINDER_SEND_JOB_NAME = "sendSpecificProposalReminder";
const TWICE_DAILY_CRON_PATTERN = "30 11,23 * * *"; // 11:30 and 23:30 UTC (5 PM / 5 AM IST)

type ReviewerRole = "supervisor" | "drc" | "dac";
type TargetRole = ReviewerRole | "student";

export const proposalReminderQueue = new Queue(QUEUE_NAME, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 10000 },
        removeOnComplete: { age: 3600 * 24 * 7 }, // Keep successful jobs for 7 days
        removeOnFail: { age: 3600 * 24 * 14 }, // Keep failed jobs for 14 days
    },
});

// Reminder intervals remain the same
const REMINDER_INTERVALS = [
    { days: 5, hours: 0, minutes: 0, label: "T-5d" },
    { days: 2, hours: 0, minutes: 0, label: "T-2d" },
    { days: 1, hours: 0, minutes: 0, label: "T-1d" },
    { days: 0, hours: 12, minutes: 0, label: "T-12h" },
    { days: 0, hours: 8, minutes: 0, label: "T-8h" },
    { days: 0, hours: 4, minutes: 0, label: "T-4h" },
    { days: 0, hours: 2, minutes: 0, label: "T-2h" },
    { days: 0, hours: 0, minutes: 30, label: "T-30m" },
    { days: 0, hours: 0, minutes: 15, label: "T-15m" },
] as const;

// Helper to calculate reminder times
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

// Map status to the next expected action/deadline
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

// Interface for the specific reminder job data
interface SpecificReminderJobData {
    semesterId: number;
    role: TargetRole;
    deadlineType: keyof typeof deadlineColumnMap;
    deadlineTimestamp: number; // Storing timestamp for quick checks
    reminderLabel: string;
}

export const proposalReminderWorker = new Worker(
    QUEUE_NAME,
    async (job: Job<SpecificReminderJobData | unknown, any, string>) => {
        // Handle the scheduling job
        if (job.name === SCHEDULER_JOB_NAME) {
            logger.info(`Running job: ${SCHEDULER_JOB_NAME}`);
            try {
                await runTwiceDailyReminderChecksAndScheduleSpecifics();
                logger.info(`Finished job: ${SCHEDULER_JOB_NAME}`);
            } catch (error) {
                logger.error(`Error during ${SCHEDULER_JOB_NAME}:`, error);
                throw error;
            }
        }
        // Handle the specific reminder sending job
        else if (job.name === REMINDER_SEND_JOB_NAME) {
            const data = job.data as SpecificReminderJobData;
            logger.info(
                `Running job: ${REMINDER_SEND_JOB_NAME} for ${data.role} - ${data.reminderLabel} (Deadline: ${new Date(data.deadlineTimestamp).toLocaleString()})`
            );
            try {
                // Fetch semester again inside the job to ensure latest data
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

                // Execute reminder logic (send emails)
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
    { connection: redisConfig, concurrency: 5 } // Increase concurrency slightly if needed
);

// Renamed scheduling function to reflect its purpose
export async function scheduleTwiceDailyReminderScheduler() {
    const jobKey = `${SCHEDULER_JOB_NAME}:::${SCHEDULER_JOB_NAME}::pattern:${TWICE_DAILY_CRON_PATTERN}`; // Use scheduler job name
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
        SCHEDULER_JOB_NAME, // Schedule the scheduler job
        {},
        {
            repeat: { pattern: TWICE_DAILY_CRON_PATTERN },
            jobId: SCHEDULER_JOB_NAME, // Use scheduler job name
            removeOnComplete: true,
            removeOnFail: { age: 3600 * 24 * 7 },
        }
    );
    logger.info(
        `Scheduled repeatable job: ${SCHEDULER_JOB_NAME} with pattern "${TWICE_DAILY_CRON_PATTERN}"`
    );
}

// This function now *schedules* specific reminder jobs, it doesn't send emails directly
async function runTwiceDailyReminderChecksAndScheduleSpecifics() {
    logger.info(
        `[${SCHEDULER_JOB_NAME}] Starting checks to schedule specific reminders.`
    );
    const now = new Date();

    // Look for semesters with deadlines in the relevant future (e.g., next 7 days)
    const checkEndDate = new Date(now);
    checkEndDate.setDate(checkEndDate.getDate() + 7); // Schedule reminders for the upcoming week

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
            if (!deadlineDate || deadlineDate < now) continue; // Skip past deadlines

            // Find the role associated with this deadline
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

                // Only schedule if the reminder time is in the future
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

                    // Add the specific job with delay
                    await proposalReminderQueue.add(
                        REMINDER_SEND_JOB_NAME,
                        jobData,
                        {
                            delay,
                            jobId, // Use unique ID to prevent duplicates if scheduler runs > once per interval
                            removeOnComplete: { age: 3600 * 24 },
                            removeOnFail: { age: 3600 * 24 * 7 },
                        }
                    );
                    scheduledCount++;
                    // logger.debug(`[${SCHEDULER_JOB_NAME}] Scheduled job ${jobId} with delay ${delay}ms`);
                }
            }
        }
    }
    logger.info(
        `[${SCHEDULER_JOB_NAME}] Finished scheduling potentially ${scheduledCount} specific reminder jobs.`
    );
}

// --- Functions to HANDLE the specific reminder job (sending emails) ---

async function handleStudentReminders(
    semester: typeof phdProposalSemesters.$inferSelect,
    deadlineType: keyof typeof deadlineColumnMap, // Added deadlineType
    reminderLabel: string // Added reminderLabel
) {
    const deadline = new Date(semester[deadlineType]); // Use the correct deadline
    logger.info(
        `[${REMINDER_SEND_JOB_NAME}] Sending student reminders (${reminderLabel}) for deadline: ${deadline.toLocaleString()}`
    );

    // Find proposals STILL in draft or relevant reverted status for this semester
    const relevantStatuses: (typeof phdSchemas.phdProposalStatuses)[number][] =
        ["draft"];
    if (deadlineType === "studentSubmissionDate") {
        // Only add revert statuses if it's the student deadline
        relevantStatuses.push("supervisor_revert", "drc_revert", "dac_revert");
    }

    const proposalsToRemind = await db.query.phdProposals.findMany({
        where: and(
            eq(phdProposals.proposalSemesterId, semester.id),
            inArray(phdProposals.status, relevantStatuses)
        ),
        columns: { studentEmail: true, id: true }, // Include ID for link
        with: { student: { columns: { name: true } } },
    });

    if (proposalsToRemind.length === 0) {
        logger.info(
            `[${REMINDER_SEND_JOB_NAME}] No student proposals found needing reminder (${reminderLabel}) for deadline ${deadline.toLocaleDateString()}.`
        );
        return;
    }

    // const studentEmails = proposalsToRemind.map((p) => p.studentEmail);
    const emailsToSend = proposalsToRemind.map((p) => ({
        // Send one email per proposal for accurate links
        to: p.studentEmail,
        subject: `Reminder (${reminderLabel}): PhD Proposal Action Needed`,
        text: `This is a reminder regarding your PhD proposal. Action is required before the deadline on ${deadline.toLocaleString()}.\n\nPlease ensure your proposal is submitted or resubmitted as needed.\n\nView Proposal: ${environment.FRONTEND_URL}/phd/phd-student/proposals/${p.id}`, // Link to specific proposal
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
    _deadlineType: keyof typeof deadlineColumnMap, // Added deadlineType
    reminderLabel: string // Added reminderLabel
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

    // Find proposals STILL needing review for this semester and status
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
    let drcConvenersCache: { email: string }[] | null = null; // Use cache

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

// Call scheduleTwiceDailyReminderScheduler() once on application start (e.g., in bin.ts)
