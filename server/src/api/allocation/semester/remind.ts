import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { faculty, phd } from "@/config/db/schema/admin.ts";
import { createNotifications, createTodos } from "@/lib/todos/index.ts";
import { sendEmail } from "@/lib/common/email.ts";
import assert from "assert";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { getLatestSemester } from "./getLatest.ts";
import environment from "@/config/environment.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess("allocation:form:publish"),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        
        const latestSemester = await getLatestSemester();

        if (!latestSemester) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    "No semesters found in the database"
                )
            );
        }

        if (!latestSemester.form) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Form not published yet"
                )
            );
        }

        const faculties = (await db.select().from(faculty)).map(
            (el) => el.email
        );

        const phds = (await db.select().from(phd)).map(
            (el) => el.email
        );

        const recipients = [ ...faculties, ...phds ]

        const todos: Parameters<typeof createTodos>[0] = recipients.map(
            (el) => ({
                module: "Course Allocation",
                title: "Course Preference Submission Reminder",
                description: `Submit your course preferences for the upcoming semester`,
                assignedTo: el,
                link: `/allocation/forms/${latestSemester.formId}/submit`,
                completionEvent: `preference submission by ${el}`,
                createdBy: req.user!.email,
            })
        );

        const notifications: Parameters<typeof createNotifications>[0] =
            recipients.map((el) => ({
                module: "Course Allocation",
                title: "Course Preference Submission Reminder",
                userEmail: el,
                content: `Submit your course preferences for the upcoming semester`,
                link: `/allocation/forms/${latestSemester.formId}/submit`,
            }));

        const email: Parameters<typeof sendEmail>[0] = {
                to: environment.DEPARTMENT_EMAIL,
                bcc: recipients,
                inReplyTo: latestSemester.form.emailMsgId!,
                subject:
                    "REMINDER: Teaching Allocation Submission For the Upcoming Semester",
                html: latestSemester.form.emailBody!,
            }

        await createTodos(todos);
        await createNotifications(notifications);
        await sendEmail(email);

        res.send("Reminder sent successfully");
    })
);

export default router;
