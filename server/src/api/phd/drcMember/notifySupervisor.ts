import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { phdSchemas } from "lib";
import { createNotifications, createTodos } from "@/lib/todos/index.ts";
import { sendEmail } from "@/lib/common/email.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import assert from "assert";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import db from "@/config/db/index.ts";
import { phdExamApplications } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.post(
    "/:applicationId",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user, "User must be defined");
        const { subject, body, recipient } =
            phdSchemas.singleNotificationPayloadSchema.parse(req.body);
        const { applicationId } = req.params;

        const application = await db.query.phdExamApplications.findFirst({
            where: eq(phdExamApplications.id, parseInt(applicationId)),
            with: {
                student: true,
            },
        });

        if (!application) {
            throw new HttpError(HttpCode.NOT_FOUND, "Application not found.");
        }

        const htmlBody = DOMPurify.sanitize(marked(body));

        await sendEmail({
            to: recipient,
            subject,
            html: htmlBody,
        });

        await createNotifications([
            {
                userEmail: recipient,
                title: subject,
                content: body,
                module: "PhD Qe Application" as const,
                link: "/phd/supervisor/examiner-suggestions",
            },
        ]);

        await createTodos([
            {
                assignedTo: recipient,
                createdBy: req.user.email,
                title: `Suggest Examiners for ${application.student.name}`,
                description: body,
                module: "PhD Qe Application" as const,
                completionEvent: `examiner_suggestion_${applicationId}`,
                link: "/phd/supervisor/examiner-suggestions",
            },
        ]);

        res.status(200).json({ success: true, message: "Notification sent." });
    })
);

export default router;
