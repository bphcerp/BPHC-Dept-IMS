import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { allocationForm } from "@/config/db/schema/allocationFormBuilder.ts";
import { allocationFormPublishSchema } from "node_modules/lib/src/schemas/AllocationFormBuilder.ts";
import { eq } from "drizzle-orm";
import { semester } from "@/config/db/schema/allocation.ts";
import { faculty, phd } from "@/config/db/schema/admin.ts";
import { createNotifications, createTodos } from "@/lib/todos/index.ts";
import { sendEmail } from "@/lib/common/email.ts";
import assert from "assert";
import environment from "@/config/environment.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess("allocation:form:publish"),
    asyncHandler(async (req, res) => {
        assert(req.user);
        const { id } = req.params;
        const { allocationDeadline, emailBody } =
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
                    allocationDeadline,
                    emailBody,
                })
                .where(eq(allocationForm.id, semesterUpdated[0].formId!));
            return semesterUpdated;
        });

        const faculties = (await db.select().from(faculty)).map(
            (el) => el.email
        );

        const phds = (await db.select().from(phd)).map((el) => el.email);

        const recipients = [...faculties, ...phds];

        const todos: Parameters<typeof createTodos>[0] = recipients.map(
            (el) => ({
                module: "Course Allocation",
                title: "Course Preference Submission",
                description: `Submit your course preferences for the upcoming semester`,
                assignedTo: el,
                link: `/allocation/forms/${semesterUpdated[0].formId}/submit`,
                completionEvent: `preference submission by ${el}`,
                deadline: allocationDeadline,
                createdBy: req.user!.email,
            })
        );

        const notifications: Parameters<typeof createNotifications>[0] =
            recipients.map((el) => ({
                module: "Course Allocation",
                title: "Course Preference Submission",
                userEmail: el,
                content: `Submit your course preferences for the upcoming semester`,
                link: `/allocation/forms/${semesterUpdated[0].formId}/submit`,
            }));

        const email: Parameters<typeof sendEmail>[0] = {
            to: environment.DEPARTMENT_EMAIL,
            bcc: recipients,
            subject:
                "REMINDER: Teaching Allocation Submission For the Upcoming Semester",
            html: emailBody,
        };

        await createTodos(todos);
        await createNotifications(notifications);
        const emailMsg = (await sendEmail(email)).returnvalue;

        if (emailMsg.messageId) {
            await db
                .update(allocationForm)
                .set({
                    emailMsgId: emailMsg!.messageId,
                })
                .where(eq(allocationForm.id, semesterUpdated[0].formId!));
        }

        res.send("Form published successfully");
    })
);

export default router;
