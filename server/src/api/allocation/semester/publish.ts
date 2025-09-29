import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { allocationForm } from "@/config/db/schema/allocationFormBuilder.ts";
import { allocationFormPublishSchema } from "node_modules/lib/src/schemas/AllocationFormBuilder.ts";
import { eq } from "drizzle-orm";
import { semester } from "@/config/db/schema/allocation.ts";
import { faculty } from "@/config/db/schema/admin.ts";
import { createNotifications, createTodos } from "@/lib/todos/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import assert from "assert";

const router = express.Router();

router.post(
    "/:id",
    checkAccess("allocation:form:publish"),
    asyncHandler(async (req, res) => {
        assert(req.user);
        const { id } = req.params;
        const { allocationDeadline, emailBody } =
            allocationFormPublishSchema.parse(req.body);

        await db.transaction(async (tx) => {
            const semesterUpdated = await tx
                .update(semester)
                .set({ allocationStatus: "ongoing" })
                .where(eq(semester.id, id))
                .returning();

            await tx
                .update(allocationForm)
                .set({ publishedDate: new Date(), allocationDeadline })
                .where(eq(allocationForm.id, semesterUpdated[0].formId!));

            const faculties = (await tx.select().from(faculty)).map(
                (el) => el.email
            );

            const todos: Parameters<typeof createTodos>[0] = faculties.map(
                (el) => ({
                    module: "Course Allocation",
                    title: "Course Preference Submission Reminder",
                    description: `Submit your course preferences for the upcoming semester`,
                    assignedTo: el,
                    link: `/allocation/forms/${semesterUpdated[0].formId}/submit`,
                    completionEvent: `preference submission by ${el}`,
                    createdBy: req.user!.email,
                })
            );

            const notifications: Parameters<typeof createNotifications>[0] =
                faculties.map((el) => ({
                    module: "Course Allocation",
                    title: "Course Preference Submission Reminder",
                    userEmail: el,
                    content: `Submit your course preferences for the upcoming semester`,
                    link: `/allocation/forms/${semesterUpdated[0].formId}/submit`,
                }));

            const emails: Parameters<typeof sendBulkEmails>[0] = faculties.map(
                (email) => ({
                    to: email,
                    subject: "IMPORTANT: Teaching Allocation Submission For the Upcoming Semester",
                    html: emailBody,
                })
            );

            await createTodos(todos);
            await createNotifications(notifications);
            await sendBulkEmails(emails);
        });

        res.send("Form published successfully");
    })
);

export default router;
