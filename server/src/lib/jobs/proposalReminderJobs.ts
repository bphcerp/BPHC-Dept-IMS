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
import { and, gte, inArray, or, eq } from "drizzle-orm"; // Removed unused imports
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { phdSchemas } from "lib";

const QUEUE_NAME = "proposalReminderQueue";
const JOB_NAME = "twiceDailyProposalReminderCheck";
const TWICE_DAILY_CRON_PATTERN = "30 11,23 * * *"; // 11:30 and 23:30 UTC (5 PM / 5 AM IST)

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
    { days: 0, hours: 4, minutes: 0, label: "T-4h" },
    { days: 0, hours: 2, minutes: 0, label: "T-2h" },
    { days: 0, hours: 0, minutes: 30, label: "T-30m" },
    { days: 0, hours: 0, minutes: 15, label: "T-15m" },
] as const;

// --- Added definition ---
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

// --- Added definition ---
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
    }, // Reverted proposals need student action before the original student deadline
    drc_revert: { role: "student", deadlineKey: "studentSubmissionDate" }, // Same logic
    dac_revert: { role: "student", deadlineKey: "studentSubmissionDate" }, // Same logic
    dac_accepted: null,
    seminar_pending: null,
    finalising_documents: null,
    completed: null,
    deleted: null,
    rejected: null,
    draft_expired: null,
};

// --- Added definition ---
const deadlineColumnMap = {
    studentSubmissionDate: phdProposalSemesters.studentSubmissionDate,
    facultyReviewDate: phdProposalSemesters.facultyReviewDate,
    drcReviewDate: phdProposalSemesters.drcReviewDate,
    dacReviewDate: phdProposalSemesters.dacReviewDate,
} as const;

export const proposalReminderWorker = new Worker(
    QUEUE_NAME,
    async (job: Job<unknown, any, string>) => {
        if (job.name === JOB_NAME) {
            logger.info(`Running job: ${JOB_NAME}`);
            try {
                await runTwiceDailyReminderChecks();
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

export async function scheduleTwiceDailyProposalReminders() {
    const jobKey = `${JOB_NAME}:::${JOB_NAME}::pattern:${TWICE_DAILY_CRON_PATTERN}`;
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
        JOB_NAME,
        {},
        {
            repeat: { pattern: TWICE_DAILY_CRON_PATTERN },
            jobId: JOB_NAME,
            removeOnComplete: true,
            removeOnFail: { age: 3600 * 24 * 7 },
        }
    );
    logger.info(
        `Scheduled repeatable job: ${JOB_NAME} with pattern "${TWICE_DAILY_CRON_PATTERN}"`
    );
}

async function runTwiceDailyReminderChecks() {
    logger.info(`[${JOB_NAME}] Starting twice-daily reminder checks.`);
    const now = new Date();
    const checkStartTime = new Date(now);
    const checkEndTime = new Date(now);
    checkEndTime.setHours(checkEndTime.getHours() + 12);

    const potentiallyRelevantSemesters =
        await db.query.phdProposalSemesters.findMany({
            where: or(
                gte(phdProposalSemesters.studentSubmissionDate, checkStartTime),
                gte(phdProposalSemesters.facultyReviewDate, checkStartTime),
                gte(phdProposalSemesters.drcReviewDate, checkStartTime),
                gte(phdProposalSemesters.dacReviewDate, checkStartTime)
            ),
        });

    if (potentiallyRelevantSemesters.length === 0) {
        logger.info(
            `[${JOB_NAME}] No potentially relevant semester deadlines found in the upcoming window.`
        );
        return;
    }

    logger.info(
        `[${JOB_NAME}] Found ${potentiallyRelevantSemesters.length} semesters with potentially relevant deadlines.`
    );

    const emailsToSend: { to: string; subject: string; text: string }[] = [];
    let drcConvenersCache: { email: string }[] | null = null;

    for (const semester of potentiallyRelevantSemesters) {
        // Corrected loop variable name
        for (const deadlineKeyStr of Object.keys(deadlineColumnMap)) {
            const deadlineKey =
                deadlineKeyStr as keyof typeof deadlineColumnMap; // Type assertion
            const deadlineDate = semester[deadlineKey];
            if (!deadlineDate || deadlineDate < now) continue;

            for (const interval of REMINDER_INTERVALS) {
                const reminderTime = calculateReminderTime(
                    deadlineDate,
                    interval
                );

                if (reminderTime >= now && reminderTime < checkEndTime) {
                    const timeDiffMillis =
                        deadlineDate.getTime() - now.getTime();
                    const intervalMillis =
                        interval.days * 24 * 60 * 60 * 1000 +
                        interval.hours * 60 * 60 * 1000 +
                        interval.minutes * 60 * 1000;

                    const toleranceMillis = 30 * 60 * 1000;
                    if (
                        Math.abs(timeDiffMillis - intervalMillis) >
                        toleranceMillis
                    ) {
                        continue;
                    }

                    logger.info(
                        `[${JOB_NAME}] Match found: ${interval.label} reminder for ${deadlineKey} (Deadline: ${deadlineDate.toISOString()}) should trigger now.`
                    );

                    const targetStatusInfo = Object.entries(
                        statusDeadlineMap
                    ).find(([, v]) => v?.deadlineKey === deadlineKey);
                    if (!targetStatusInfo || !targetStatusInfo[1]) continue;

                    const targetStatus =
                        targetStatusInfo[0] as (typeof phdSchemas.phdProposalStatuses)[number];
                    const targetRole = targetStatusInfo[1].role;

                    logger.info(
                        `[${JOB_NAME}] Checking for proposals in status '${targetStatus}' for semester ${semester.id}`
                    );

                    const proposals = await db.query.phdProposals.findMany({
                        where: and(
                            eq(phdProposals.proposalSemesterId, semester.id),
                            eq(phdProposals.status, targetStatus)
                        ),
                        with: {
                            student: { columns: { name: true } },
                            ...(targetRole === "dac" && {
                                dacMembers: {
                                    columns: { dacMemberEmail: true },
                                },
                            }),
                        },
                        columns: {
                            id: true,
                            studentEmail: true,
                            supervisorEmail: true,
                        },
                    });

                    if (proposals.length === 0) {
                        logger.info(
                            `[${JOB_NAME}] No proposals found in status '${targetStatus}' requiring ${interval.label} reminder.`
                        );
                        continue;
                    }

                    logger.info(
                        `[${JOB_NAME}] Found ${proposals.length} proposals in status '${targetStatus}' requiring ${interval.label} reminder.`
                    );

                    // --- Determine Recipients ---
                    let recipientsMap = new Map<
                        string,
                        { studentName: string; proposalId: number }[]
                    >();

                    if (targetRole === "student") {
                        proposals.forEach((p) => {
                            if (!recipientsMap.has(p.studentEmail))
                                recipientsMap.set(p.studentEmail, []);
                            recipientsMap.get(p.studentEmail)!.push({
                                studentName: p.student.name || p.studentEmail,
                                proposalId: p.id,
                            });
                        });
                    } else if (targetRole === "supervisor") {
                        proposals.forEach((p) => {
                            if (p.supervisorEmail) {
                                if (!recipientsMap.has(p.supervisorEmail))
                                    recipientsMap.set(p.supervisorEmail, []);
                                recipientsMap.get(p.supervisorEmail)!.push({
                                    studentName:
                                        p.student.name || p.studentEmail,
                                    proposalId: p.id,
                                });
                            } else {
                                logger.warn(
                                    `[${JOB_NAME}] Proposal ${p.id} awaiting supervisor action has no supervisor email.`
                                );
                            }
                        });
                    } else if (targetRole === "drc") {
                        if (drcConvenersCache === null) {
                            drcConvenersCache =
                                await getUsersWithPermission(
                                    "phd:drc:proposal"
                                );
                            if (drcConvenersCache.length === 0)
                                logger.warn(
                                    `[${JOB_NAME}] DRC reminders needed, but no users found with 'phd:drc:proposal' permission.`
                                );
                        }
                        proposals.forEach((p) => {
                            drcConvenersCache?.forEach((drc) => {
                                if (!recipientsMap.has(drc.email))
                                    recipientsMap.set(drc.email, []);
                                recipientsMap.get(drc.email)!.push({
                                    studentName:
                                        p.student.name || p.studentEmail,
                                    proposalId: p.id,
                                });
                            });
                        });
                    } else if (targetRole === "dac") {
                        for (const p of proposals) {
                            const proposalWithDac = p as typeof p & {
                                dacMembers?: { dacMemberEmail: string }[];
                            };
                            if (
                                !proposalWithDac.dacMembers ||
                                proposalWithDac.dacMembers.length === 0
                            ) {
                                logger.warn(
                                    `[${JOB_NAME}] Proposal ${p.id} is in dac_review but has no DAC members.`
                                );
                                continue;
                            }
                            const assignedDacEmails =
                                proposalWithDac.dacMembers.map(
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
                                            p.id
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
                            const pendingDacEmails = assignedDacEmails.filter(
                                (email) => !reviewedEmails.has(email)
                            );

                            pendingDacEmails.forEach((email) => {
                                if (!recipientsMap.has(email))
                                    recipientsMap.set(email, []);
                                recipientsMap.get(email)!.push({
                                    studentName:
                                        p.student.name || p.studentEmail,
                                    proposalId: p.id,
                                });
                            });
                        }
                    }

                    // --- Generate and Add Emails ---
                    const linkPaths: Record<TargetRole, string> = {
                        student: "/phd/phd-student/proposals",
                        supervisor: "/phd/supervisor/proposal/",
                        drc: "/phd/drc-convenor/proposal-management/",
                        dac: "/phd/dac/proposals/",
                    };

                    for (const [
                        recipientEmail,
                        tasks,
                    ] of recipientsMap.entries()) {
                        if (tasks.length > 0) {
                            const taskList = tasks
                                .map(
                                    (task) =>
                                        `- ${task.studentName} (ID: ${task.proposalId})`
                                )
                                .join("\n");
                            const firstProposalId = tasks[0].proposalId;
                            const link = `${environment.FRONTEND_URL}${linkPaths[targetRole]}${targetRole === "student" ? "" : firstProposalId}`;

                            const subject = `Reminder: PhD Proposal Action Due Soon (${interval.label})`;
                            const body = `This is a reminder that action is required on one or more PhD proposals by ${deadlineDate.toLocaleString()}.\n\nPending Tasks:\n${taskList}\n\nPlease log in to the portal to take action:\n${link}\n\nThank you.`;

                            emailsToSend.push({
                                to: recipientEmail,
                                subject,
                                text: body,
                            });
                        }
                    }
                    break;
                }
            }
        }
    }

    if (emailsToSend.length > 0) {
        logger.info(
            `[${JOB_NAME}] Sending ${emailsToSend.length} reminder emails.`
        );
        try {
            await sendBulkEmails(emailsToSend);
            logger.info(
                `[${JOB_NAME}] Successfully sent ${emailsToSend.length} reminder emails.`
            );
        } catch (error) {
            logger.error(
                `[${JOB_NAME}] Failed to send bulk reminder emails:`,
                error
            );
        }
    } else {
        logger.info(`[${JOB_NAME}] No reminders to send in this check.`);
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


