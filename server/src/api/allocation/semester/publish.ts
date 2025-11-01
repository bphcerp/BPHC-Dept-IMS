import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { allocationForm } from "@/config/db/schema/allocationFormBuilder.ts";
import { allocationFormPublishSchema } from "node_modules/lib/src/schemas/AllocationFormBuilder.ts";
import { eq } from "drizzle-orm";
import { semester } from "@/config/db/schema/allocation.ts";
import { createNotifications, createTodos } from "@/lib/todos/index.ts";
import { sendEmail } from "@/lib/common/email.ts";
import assert from "assert";
import environment from "@/config/environment.ts";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

const router = express.Router();

router.post(
    "/:id",
    checkAccess("allocation:form:publish"),
    asyncHandler(async (req, res) => {
        assert(req.user);
        const { id } = req.params;
        const { formDeadline, emailBody, isPublishedToRoleId } =
            allocationFormPublishSchema.parse(req.body);

        const semesterUpdated = await db.transaction(async (tx) => {
            const semesterUpdated = await tx
                .update(semester)
                .set({ allocationStatus: "formCollection" })
                .where(eq(semester.id, id))
                .returning();

            await tx
                .update(allocationForm)
                .set({
                    publishedDate: new Date(),
                    formDeadline,
                    isPublishedToRoleId,
                })
                .where(eq(allocationForm.id, semesterUpdated[0].formId!));
            return semesterUpdated;
        });

        const recipients = (
            await db.query.users.findMany({
                where: (users, { and, sql, eq }) =>
                    and(
                        sql`${isPublishedToRoleId} = ANY(${users.roles})`,
                        eq(users.deactivated, false)
                    ),
            })
        ).map((el) => el.email);

        assert(semesterUpdated[0].formId);
        assert(recipients.length > 0);

        const htmlBody = DOMPurify.sanitize(marked(emailBody));

        const todos: Parameters<typeof createTodos>[0] = recipients.map(
            (el) => ({
                module: "Course Allocation",
                title: "Course Preference Submission",
                description: `Submit your course preferences for the upcoming semester`,
                assignedTo: el,
                link: `/allocation/submit`,
                completionEvent: `preference submission by ${el}`,
                deadline: formDeadline,
                createdBy: req.user!.email,
            })
        );

        const notifications: Parameters<typeof createNotifications>[0] =
            recipients.map((el) => ({
                module: "Course Allocation",
                title: "Course Preference Submission",
                userEmail: el,
                content: `Submit your course preferences for the upcoming semester`,
                link: `/allocation/submit`,
            }));

        const email: Parameters<typeof sendEmail>[0] = {
            to: environment.DEPARTMENT_EMAIL,
            bcc: recipients,
            subject:
                "IMPORTANT: Teaching Allocation Submission For the Upcoming Semester",
            html: htmlBody,
            priority: 'high'
        };

        await createTodos(todos);
        await createNotifications(notifications);
        const emailMsg = await sendEmail(email, true);

        if (emailMsg?.messageId) {
            await db
                .update(allocationForm)
                .set({
                    emailMsgId: emailMsg.messageId,
                })
                .where(eq(allocationForm.id, semesterUpdated[0].formId!));
        }

        res.send("Form published successfully");
    })
);

export default router;
