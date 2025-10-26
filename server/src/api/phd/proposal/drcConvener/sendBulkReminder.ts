// server/src/api/phd/proposal/drcConvener/sendBulkReminder.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { z } from "zod";
import { sendBulkEmails } from "@/lib/common/email.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import assert from "assert";
import environment from "@/config/environment.ts";

const router = express.Router();

const bulkReminderBackendSchema = z.object({
    targetEmails: z
        .array(z.string().email())
        .min(1, "At least one recipient is required."),
    subject: z.string().min(1, "Subject cannot be empty."),
    body: z.string().min(1, "Body cannot be empty."),
});

router.post(
    "/",
    checkAccess("phd:drc:proposal"),
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

        // proposalIds is extracted but kept mainly for potential linking context below
        const { targetEmails, subject, body } = parsed.data;

        const defaultLink = environment.FRONTEND_URL;
        // Simple default link, as the specific context might be complex for bulk sends
        const linkToSend = defaultLink;

        const finalBody = body.replace(/{{link}}/g, linkToSend);
        const finalSubject = subject;

        const emailsToSend = targetEmails.map((email) => ({
            to: email,
            subject: finalSubject,
            text: finalBody,
        }));

        try {
            await sendBulkEmails(emailsToSend);
            res.status(200).json({
                success: true,
                message: `Bulk reminder sent successfully to ${targetEmails.length} recipients.`,
            });
        } catch (emailError) {
            console.error("Failed to send bulk emails:", emailError);
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
