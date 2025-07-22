import db from "@/config/db/index.ts";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import express from "express";
import { handoutSchemas } from "lib";
import { checkAccess } from "@/middleware/auth.ts";
import { createNotifications, createTodos } from "@/lib/todos/index.ts";
import assert from "assert";
import { sendBulkEmails } from "@/lib/common/email.ts";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user);
        const parsed = handoutSchemas.deadlineBodySchema.parse({
            time: new Date((req.body as { time: string }).time),
            emailBody: req.body.emailBody,
        });
        const htmlBody = DOMPurify.sanitize(marked(parsed.emailBody));

        const handouts = await db
            .update(courseHandoutRequests)
            .set({ deadline: parsed.time })
            .where(eq(courseHandoutRequests.status, "notsubmitted"))
            .returning();
        const todos: Parameters<typeof createTodos>[0] = [];
        const notifications: Parameters<typeof createNotifications>[0] = [];
        const emails: Parameters<typeof sendBulkEmails>[0] = [];
        for (const handout of handouts) {
            if (handout.icEmail) {
                todos.push({
                    module: "Course Handout",
                    title: "Course Handout Submission",
                    description: `Upload handouts for the ${handout.courseName} (Course Code : ${handout.courseCode})`,
                    assignedTo: handout.icEmail,
                    link: "/handout/faculty",
                    completionEvent: `handout submission ${handout.courseCode} by ${handout.icEmail}`,
                    createdBy: req.user.email,
                });
                notifications.push({
                    module: "Course Handout",
                    title: "Course Handout Submission",
                    userEmail: handout.icEmail,
                    content: `Upload handouts for the Course ${handout.courseName} (Course Code : ${handout.courseCode})`,
                    link: "/handout/faculty",
                });

                emails.push({
                    to: handout.icEmail,
                    subject: "Handout Submission Reminder",
                    html: htmlBody,
                });
            }
        }
        await createTodos(todos);
        await createNotifications(notifications);
        await sendBulkEmails(emails);
        res.status(200).json({ success: true });
    })
);

export default router;
