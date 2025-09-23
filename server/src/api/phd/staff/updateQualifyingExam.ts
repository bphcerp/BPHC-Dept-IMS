import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import {
    phdEmailTemplates,
    phdQualifyingExams,
} from "@/config/db/schema/phd.ts";
import { phdSchemas } from "lib";
import { createNotifications } from "@/lib/todos/index.ts";
import Mustache from "mustache";
import { eq } from "drizzle-orm";

const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = phdSchemas.updateQualifyingExamSchema.parse(req.body);
        const {
            semesterId,
            examName,
            examStartDate,
            examEndDate,
            submissionDeadline,
            vivaDate,
        } = parsed;
        const semester = await db.query.phdSemesters.findFirst({
            where: (table, { eq }) => eq(table.id, semesterId),
        });
        if (!semester) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Semester not found");
        }
        const exam = await db
            .insert(phdQualifyingExams)
            .values({
                semesterId,
                examName,
                examStartDate: new Date(examStartDate),
                examEndDate: new Date(examEndDate),
                submissionDeadline: new Date(submissionDeadline),
                vivaDate: new Date(vivaDate),
            })
            .returning()
            .onConflictDoUpdate({
                target: [
                    phdQualifyingExams.semesterId,
                    phdQualifyingExams.examName,
                ],
                set: {
                    examStartDate: new Date(examStartDate),
                    examEndDate: new Date(examEndDate),
                    submissionDeadline: new Date(submissionDeadline),
                    vivaDate: new Date(vivaDate),
                },
            });

        const allUsers = await db.query.users.findMany();
        const template = await db.query.phdEmailTemplates.findFirst({
            where: eq(phdEmailTemplates.name, "new_exam_announcement"),
        });

        if (template) {
            const view = {
                examName: examName,
                semesterYear: semester.year,
                semesterNumber: semester.semesterNumber,
                submissionDeadline: new Date(
                    submissionDeadline
                ).toLocaleString(),
                examStartDate: new Date(examStartDate).toLocaleString(),
                examEndDate: new Date(examEndDate).toLocaleString(),
                vivaDate: new Date(vivaDate).toLocaleString(),
            };
            const notificationContent = Mustache.render(template.body, view);
            const subject = Mustache.render(template.subject, view);

            await createNotifications(
                allUsers.map((user) => ({
                    module: "PhD Qe Application",
                    title: subject,
                    content: notificationContent, 
                    userEmail: user.email,
                }))
            );
        }

        res.status(200).json({
            message: "Qualifying exam created successfully",
            exam: exam[0],
        });
    })
);
