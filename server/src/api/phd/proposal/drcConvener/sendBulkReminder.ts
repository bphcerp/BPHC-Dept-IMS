import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { modules } from "lib";
import { z } from "zod";
import { createTodos } from "@/lib/todos/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import assert from "assert";

const router = express.Router();

// Schema matching the frontend bulkReminderSchema
const bulkReminderBackendSchema = z.object({
    targetEmails: z
        .array(z.string().email())
        .min(1, "At least one recipient is required."),
    proposalIds: z.array(z.number().positive()), // Accept proposal IDs
    subject: z.string().min(1, "Subject cannot be empty."),
    body: z.string().min(1, "Body cannot be empty."),
    deadline: z.coerce.date().optional(), // Use coerce for date transformation
});

router.post(
    "/",
    checkAccess("phd:drc:proposal"), // Ensure appropriate permission
    asyncHandler(async (req, res, next) => {
        assert(req.user, "User must be authenticated for this action.");
        const parsed = bulkReminderBackendSchema.safeParse(req.body);

        if (!parsed.success) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    parsed.error.errors[0].message
                )
            );
        }

        const { targetEmails, proposalIds, subject, body, deadline } =
            parsed.data;

        // Create To-Dos (optional, adjust based on desired behavior for bulk reminders)
        // Here, we create one To-Do per recipient, linking to the first proposal ID for context
        const todosToCreate = targetEmails.map((email) => ({
            assignedTo: email,
            createdBy: req.user!.email,
            title: subject, // Use subject as title
            description: `Bulk reminder sent regarding PhD proposals. Details:\n${body.substring(0, 200)}${body.length > 200 ? "..." : ""}`, // Truncated body
            module: modules[3], // PhD Proposal module
            // Completion event might be tricky for bulk, maybe use a generic one or none
            completionEvent: `proposal:bulk-reminder-sent:${Date.now()}`,
            link:
                proposalIds.length > 0
                    ? `/phd/drc-convenor/proposal-management/${proposalIds[0]}`
                    : undefined, // Link to first proposal if available
            deadline: deadline,
        }));

        if (todosToCreate.length > 0) {
            try {
                await createTodos(todosToCreate);
            } catch (todoError) {
                // Log error but proceed with sending emails
                console.error(
                    "Failed to create some To-Dos for bulk reminder:",
                    todoError
                );
            }
        }

        // Send Bulk Emails
        const emailsToSend = targetEmails.map((email) => ({
            to: email,
            subject,
            text: body, // Assuming body is plain text or includes Markdown handled by email client
            // html: body, // Or use html if body is HTML formatted
        }));

        try {
            await sendBulkEmails(emailsToSend);
            res.status(200).json({
                success: true,
                message: `Bulk reminder sent successfully to ${targetEmails.length} recipients.`,
            });
        } catch (emailError) {
            console.error("Failed to send bulk emails:", emailError);
            // Even if some todos were created, report email failure
            return next(
                new HttpError(
                    HttpCode.INTERNAL_SERVER_ERROR,
                    "Failed to send bulk emails. Please try again."
                )
            );
        }
    })
);

export default router;
