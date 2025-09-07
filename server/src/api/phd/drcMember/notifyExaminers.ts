import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { phdSchemas } from "lib";
import { createNotifications } from "@/lib/todos/index.ts";
import { sendEmail } from "@/lib/common/email.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import assert from "assert";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import db from "@/config/db/index.ts";
import { phdExaminerAssignments } from "@/config/db/schema/phd.ts";
import { eq, and } from "drizzle-orm";

const router = express.Router();

router.post(
    "/:applicationId",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user, "User must be defined");
        const { subject, body, recipient } =
            phdSchemas.singleNotificationPayloadSchema.parse(req.body);
        const { applicationId } = req.params;

        const assignment = await db.query.phdExaminerAssignments.findFirst({
            where: and(
                eq(
                    phdExaminerAssignments.applicationId,
                    parseInt(applicationId)
                ),
                eq(phdExaminerAssignments.examinerEmail, recipient)
            ),
        });

        if (!assignment) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "Examiner assignment not found."
            );
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
            },
        ]);

        await db
            .update(phdExaminerAssignments)
            .set({ notifiedAt: new Date() })
            .where(eq(phdExaminerAssignments.id, assignment.id));

        res.status(200).json({ success: true, message: "Notification sent." });
    })
);

export default router;
