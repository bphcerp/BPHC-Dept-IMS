import db from "@/config/db/index.ts";
import logger from "@/config/logger.ts";
import { phdProposals, phdProposalSemesters } from "@/config/db/schema/phd.ts";
import { todos } from "@/config/db/schema/todos.ts";
import { and, gte, inArray, or, sql, eq } from "drizzle-orm";
// FIX: Removed unused 'getUsersWithPermission' import
import { sendBulkEmails } from "@/lib/common/email.ts";
import { modules } from "lib";
import environment from "@/config/environment.ts";

const REMINDER_DAYS = [1, 2, 5];

/**
 * Calculates the target dates for sending reminders.
 * @param now The current date.
 * @returns An array of Date objects for T-1, T-2, and T-5 days.
 */
function getReminderTargetDates(now: Date): Date[] {
    return REMINDER_DAYS.map((days) => {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + days);
        targetDate.setHours(0, 0, 0, 0); // Normalize to the beginning of the day for comparison
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
        text: `This is a reminder that your PhD proposal is due on ${deadline}. Please ensure you submit it on the portal before the deadline.`,
    }));

    await sendBulkEmails(emailsToSend);
    logger.info(`Sent ${emailsToSend.length} reminder emails to students.`);
}

type ReviewerRole = "supervisor" | "drc" | "dac";

/**
 * Finds pending proposal reviews for Supervisors, DRC, or DAC members and sends a batched reminder email.
 */
async function handleReviewerReminders(
    semester: typeof phdProposalSemesters.$inferSelect,
    role: ReviewerRole
) {
    let reviewStatus: (typeof phdProposals.$inferSelect)["status"];
    let completionEventPrefix: string;
    let deadline: Date;

    // FIX: Removed unused 'permission' variable declaration
    switch (role) {
        case "supervisor":
            reviewStatus = "supervisor_review";
            completionEventPrefix = `proposal:supervisor-review:`;
            deadline = semester.facultyReviewDate;
            break;
        case "drc":
            reviewStatus = "drc_review";
            completionEventPrefix = `proposal:drc-review:`;
            deadline = semester.drcReviewDate;
            break;
        case "dac":
            reviewStatus = "dac_review";
            completionEventPrefix = `proposal:dac-review:`;
            deadline = semester.dacReviewDate;
            break;
    }

    const deadlineStr = new Date(deadline).toLocaleDateString();
    logger.info(`Processing ${role} reminders for deadline: ${deadlineStr}`);

    // 1. Get all proposals that are in the correct review status for this semester
    const proposalsForReview = await db.query.phdProposals.findMany({
        where: and(
            eq(phdProposals.proposalSemesterId, semester.id),
            eq(phdProposals.status, reviewStatus)
        ),
        with: {
            // FIX: Added 'student' relation to solve the property access error
            student: { columns: { name: true } },
            // FIX: Removed conditional 'when' to solve the Drizzle type error.
            // It's safe to always include this as it will only be populated for relevant proposals.
            dacMembers: { columns: { dacMemberEmail: true } },
        },
    });

    if (proposalsForReview.length === 0) {
        logger.info(
            `No proposals found awaiting ${role} review for this deadline.`
        );
        return;
    }

    // 2. Find all pending todos related to these proposals for the specific role
    const proposalIds = proposalsForReview.map((p) => p.id);
    const pendingTodos = await db.query.todos.findMany({
        where: and(
            eq(todos.module, modules[3]), // PhD Proposal module
            inArray(
                todos.completionEvent,
                proposalIds.map((id) => `${completionEventPrefix}${id}`)
            )
        ),
    });

    if (pendingTodos.length === 0) {
        logger.info(
            `All ${role} todos seem to be completed for this deadline.`
        );
        return;
    }

    // 3. Group pending tasks by the assigned reviewer's email
    const tasksByReviewer = new Map<
        string,
        { studentName: string; proposalId: number }[]
    >();

    for (const todo of pendingTodos) {
        const proposal = proposalsForReview.find(
            (p) => todo.completionEvent === `${completionEventPrefix}${p.id}`
        );
        if (proposal) {
            // This is now safe because 'student' is included in the query
            const studentName = proposal.student.name || "A student";
            if (!tasksByReviewer.has(todo.assignedTo)) {
                tasksByReviewer.set(todo.assignedTo, []);
            }
            tasksByReviewer
                .get(todo.assignedTo)!
                .push({ studentName, proposalId: proposal.id });
        }
    }

    if (tasksByReviewer.size === 0) {
        logger.info(`No pending tasks to remind for ${role}.`);
        return;
    }

    // 4. Construct and send bulk emails
    const emailsToSend = Array.from(tasksByReviewer.entries()).map(
        ([reviewerEmail, tasks]) => {
            const taskList = tasks
                .map(
                    (task) =>
                        `- ${task.studentName} (View at: ${environment.FRONTEND_URL}/phd/supervisor/proposal/${task.proposalId})`
                )
                .join("\n");

            const subject = `Reminder: PhD Proposal Reviews Due Soon`;
            const body = `This is a reminder that you have pending proposal reviews due on ${deadlineStr}.\n\nPlease review the following proposals:\n\n${taskList}\n\nThank you.`;

            return { to: reviewerEmail, subject, body };
        }
    );

    await sendBulkEmails(emailsToSend);
    logger.info(`Sent ${emailsToSend.length} reminder emails to ${role}s.`);
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
    const reminderDatesSQL = reminderDates.map(
        (d) => d.toISOString().split("T")[0]
    );

    // Find semesters with deadlines approaching in 1, 2, or 5 days
    const upcomingSemesters = await db
        .select()
        .from(phdProposalSemesters)
        .where(
            and(
                or(
                    sql`DATE(${phdProposalSemesters.studentSubmissionDate}) IN ${reminderDatesSQL}`,
                    sql`DATE(${phdProposalSemesters.facultyReviewDate}) IN ${reminderDatesSQL}`,
                    sql`DATE(${phdProposalSemesters.drcReviewDate}) IN ${reminderDatesSQL}`,
                    sql`DATE(${phdProposalSemesters.dacReviewDate}) IN ${reminderDatesSQL}`
                ),
                gte(phdProposalSemesters.dacReviewDate, today) // Ensure the cycle is still active
            )
        );

    if (upcomingSemesters.length === 0) {
        logger.info("No upcoming proposal deadlines to send reminders for.");
        return;
    }

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
}

sendProposalReminders()
    .catch((e) => {
        logger.error("Error in sendProposalReminders job:", e);
    })
    .finally(() => {
        process.exit(0);
    });
