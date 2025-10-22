// server/scripts/sendProposalReminders.ts
import db from "@/config/db/index.ts";
import logger from "@/config/logger.ts";
import { phdProposals, phdProposalSemesters } from "@/config/db/schema/phd.ts";
// REMOVED: import { todos } from "@/config/db/schema/todos.ts"; // No longer needed for reviewer logic
import { and, gte, inArray, or, sql, eq } from "drizzle-orm";
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";
import { getUsersWithPermission } from "@/lib/common/index.ts"; // Needed for DRC role

const REMINDER_DAYS = [1, 2, 5];

/**
 * Calculates the target dates for sending reminders (T+1, T+2, T+5).
 * @param now The current date.
 * @returns An array of Date objects normalized to the start of the day.
 */
function getReminderTargetDates(now: Date): Date[] {
    return REMINDER_DAYS.map((days) => {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + days);
        targetDate.setHours(0, 0, 0, 0); // Normalize to the beginning of the day
        return targetDate;
    });
}

/**
 * Finds proposals where students have not yet submitted (status is 'draft').
 * Sends a reminder to each student.
 */
async function handleStudentReminders(
    semester: typeof phdProposalSemesters.$inferSelect
) {
    const deadline = new Date(
        semester.studentSubmissionDate
    ).toLocaleDateString();
    logger.info(`Processing student reminders for deadline: ${deadline}`);

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
        logger.info("No student proposal drafts found for this deadline.");
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
        logger.info(`Sent ${emailsToSend.length} reminder emails to students.`);
    } catch (error) {
        logger.error(
            `Failed to send student reminder emails for semester ${semester.id}:`,
            error
        );
    }
}

type ReviewerRole = "supervisor" | "drc" | "dac";

/**
 * Finds pending proposal reviews for Supervisors, DRC, or DAC members
 * based *directly* on proposal status and assignments, and sends reminders.
 */
async function handleReviewerReminders(
    semester: typeof phdProposalSemesters.$inferSelect,
    role: ReviewerRole
) {
    let reviewStatus: (typeof phdProposals.$inferSelect)["status"];
    let deadline: Date;
    let linkPath: string; // Base path for the link in the email

    switch (role) {
        case "supervisor":
            reviewStatus = "supervisor_review";
            deadline = semester.facultyReviewDate;
            linkPath = "/phd/supervisor/proposal/"; // Append proposal ID later
            break;
        case "drc":
            reviewStatus = "drc_review";
            deadline = semester.drcReviewDate;
            linkPath = "/phd/drc-convenor/proposal-management/"; // Append proposal ID later
            break;
        case "dac":
            reviewStatus = "dac_review";
            deadline = semester.dacReviewDate;
            linkPath = "/phd/dac/proposals/"; // Append proposal ID later
            break;
    }

    const deadlineStr = new Date(deadline).toLocaleDateString();
    logger.info(`Processing ${role} reminders for deadline: ${deadlineStr}`);

    // 1. Get proposals in the correct review status for this semester
    const proposalsForReview = await db.query.phdProposals.findMany({
        where: and(
            eq(phdProposals.proposalSemesterId, semester.id),
            eq(phdProposals.status, reviewStatus)
        ),
        with: {
            student: { columns: { name: true } },
            // Include dacMembers relation only if needed
            ...(role === "dac" && {
                dacMembers: { columns: { dacMemberEmail: true } },
            }),
        },
        // ⭐ Always include supervisorEmail in the main columns ⭐
        columns: {
            id: true,
            supervisorEmail: true, // Now always selected
        },
    });

    if (proposalsForReview.length === 0) {
        logger.info(
            `No proposals found awaiting ${role} review for this deadline.`
        );
        return;
    }

    // 2. Group proposals by the reviewer who needs to be reminded
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
                // ⭐ Access is now safe ⭐
                if (proposal.supervisorEmail) {
                    reviewersToNotify.push(proposal.supervisorEmail);
                } else {
                    logger.warn(
                        `Proposal ${proposal.id} is in supervisor_review but has no supervisorEmail.`
                    );
                }
                break;
            case "drc":
                if (drcConveners === null) {
                    drcConveners =
                        await getUsersWithPermission("phd:drc:proposal");
                    if (drcConveners.length === 0) {
                        logger.warn(
                            "DRC reminders needed, but no users found with 'phd:drc:proposal' permission."
                        );
                    }
                }
                reviewersToNotify = drcConveners?.map((drc) => drc.email) ?? []; // Handle case where drcConvenors might be empty
                break;
            case "dac":
                // Type assertion needed here because it's conditionally included
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
                        `Proposal ${proposal.id} is in dac_review but has no DAC members assigned.`
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
            `No reviewers found needing reminders for ${role} on deadline ${deadlineStr}.`
        );
        return;
    }

    // 3. Construct and send bulk emails
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
            `Sent ${emailsToSend.length} reminder emails to ${role}s for deadline ${deadlineStr}.`
        );
    } catch (error) {
        logger.error(
            `Failed to send ${role} reminder emails for deadline ${deadlineStr}:`,
            error
        );
    }
}

/**
 * Main job function to check all proposal deadlines and trigger reminders.
 */
async function sendProposalReminders() {
    logger.info("Running job: sendProposalReminders");
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminderDates = getReminderTargetDates(now);
    // Use Date objects for comparison, avoid string conversion issues
    // const reminderDatesSQL = reminderDates.map((d) => d.toISOString().split("T")[0]);

    // Find semesters with deadlines approaching
    const upcomingSemesters = await db
        .select()
        .from(phdProposalSemesters)
        .where(
            and(
                // Check if any deadline falls exactly on one of the target dates (T+1, T+2, T+5)
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
                gte(phdProposalSemesters.dacReviewDate, today) // Ensure the overall cycle is still active/relevant
            )
        );

    if (upcomingSemesters.length === 0) {
        logger.info(
            "No upcoming proposal deadlines match reminder schedule (T+1, T+2, T+5 days)."
        );
        return;
    }

    logger.info(
        `Found ${upcomingSemesters.length} semester cycles with upcoming deadlines matching reminder schedule.`
    );

    for (const semester of upcomingSemesters) {
        // Helper to check if a specific date matches one of the target reminder dates
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
    logger.info("Finished processing reminders for upcoming deadlines.");
}

// --- Script Execution ---
sendProposalReminders()
    .catch((e) => {
        logger.error("Unhandled Error in sendProposalReminders job:", e);
        process.exitCode = 1; // Indicate failure
    })
    .finally(async () => {
        // Optional: Add a small delay if needed for logs to flush, though usually not necessary
        // await new Promise(resolve => setTimeout(resolve, 1000));
        logger.info("Exiting sendProposalReminders script.");
        // process.exit() can sometimes cut off logging, prefer setting exitCode
        // process.exit(process.exitCode ?? 0);
    });
