import db from "@/config/db/index.ts";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import { createNotifications, createTodos } from "@/lib/todos/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { inArray } from "drizzle-orm";
import express from "express";
import assert from "assert";
import { qpSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    asyncHandler(async (req, res, _next) => {
        const { courses, htmlBody } = qpSchemas.initiateRequestSchema.parse(
            req.body
        );
        const qps = await db
            .update(qpReviewRequests)
            .set({ status: "notsubmitted" })
            .where(inArray(qpReviewRequests.id, courses))
            .returning();
        const todos: Parameters<typeof createTodos>[0] = [];
        const notifications: Parameters<typeof createNotifications>[0] = [];
        const emails: Parameters<typeof sendBulkEmails>[0] = [];
        assert(req.user);
        for (const qp of qps) {
            if (qp.icEmail) {
                todos.push({
                    module: "Question Paper",
                    title: "Question Paper Submission",
                    description: `Upload question papers for the ${qp.courseName} (Course Code : ${qp.courseCode})`,
                    assignedTo: qp.icEmail,
                    link: "/qpReview/ficSubmission",
                    completionEvent: `question paper submission ${qp.courseCode} by ${qp.icEmail}`,
                    createdBy: req.user.email,
                });
                notifications.push({
                    module: "Question Paper",
                    title: "Question Paper Submission",
                    userEmail: qp.icEmail,
                    content: `Upload question papers for the ${qp.courseName} (Course Code : ${qp.courseCode})`,
                    link: "/qpReview/ficSubmission",
                });

                emails.push({
                    to: qp.icEmail,
                    subject: "Question Paper Submission Reminder",
                    html: htmlBody,
                });
            }
        }
        await createTodos(todos);
        await createNotifications(notifications);
        await sendBulkEmails(emails);

        res.status(200).json({
            success: true,
        });
    })
);

export default router;
