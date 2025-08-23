import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { phdSchemas } from "lib";
import { createNotifications } from "@/lib/todos/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import assert from "assert";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import db from "@/config/db/index.ts";
import { users } from "@/config/db/schema/admin.ts";
import { inArray } from "drizzle-orm";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user, "User must be defined");
        const { subject, body, recipients } =
            phdSchemas.notificationPayloadSchema.parse(req.body);

        if (recipients.length === 0) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "No recipients provided."
            );
        }

        const registeredUsers = await db
            .select({ email: users.email })
            .from(users)
            .where(inArray(users.email, recipients));
        const registeredRecipientEmails = registeredUsers.map((u) => u.email);

        const htmlBody = DOMPurify.sanitize(marked(body));

        const emailJobs = recipients.map((recipient) => ({
            to: recipient,
            subject,
            html: htmlBody,
        }));
        await sendBulkEmails(emailJobs);

        const notificationJobs = registeredRecipientEmails.map((recipient) => ({
            userEmail: recipient,
            title: subject,
            content: body,
            module: "PhD Qe Application" as const,
        }));
        if (notificationJobs.length > 0) {
            await createNotifications(notificationJobs);
        }

        res.status(200).json({ success: true, message: "Notifications sent." });
    })
);

export default router;
