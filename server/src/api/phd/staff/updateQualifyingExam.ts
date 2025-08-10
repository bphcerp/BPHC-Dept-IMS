import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { phdSchemas } from "lib";
import { createNotifications } from "@/lib/todos/index.ts";

const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = phdSchemas.updateQualifyingExamSchema.parse(req.body);
        const semesterId = parsed.semesterId;
        const examName = parsed.examName;
        const examStartDate = new Date(parsed.examStartDate);
        const examEndDate = new Date(parsed.examEndDate);
        const submissionDeadline = new Date(parsed.submissionDeadline);
        const vivaDate = new Date(parsed.vivaDate);

        const semester = await db.query.phdSemesters.findFirst({
            where: (table, { eq }) => eq(table.id, semesterId),
        });
        if (!semester)
            throw new HttpError(HttpCode.BAD_REQUEST, "Semester not found");

        const exam = await db
            .insert(phdQualifyingExams)
            .values({
                semesterId,
                examName,
                examStartDate,
                examEndDate,
                submissionDeadline,
                vivaDate,
            })
            .returning()
            .onConflictDoUpdate({
                target: [
                    phdQualifyingExams.semesterId,
                    phdQualifyingExams.examName,
                ],
                set: {
                    examStartDate,
                    examEndDate,
                    submissionDeadline,
                    vivaDate,
                },
            });

        const allUsers = await db.query.users.findMany();

        const notificationContent = `
    A new PhD Qualifying Exam "${examName}" has been scheduled:
    • Registration Deadline: ${submissionDeadline.toLocaleDateString()}
    • Exam Start: ${examStartDate.toLocaleDateString()}
    • Exam End: ${examEndDate.toLocaleDateString()}
    • Viva Date: ${vivaDate.toLocaleDateString()}

    For: ${semester.year} sem ${semester.semesterNumber}
  `.trim();

        await createNotifications(
            allUsers.map((user) => ({
                module: "PhD Qe Application",
                title: `New PhD Qualifying Exam: ${examName}`,
                content: notificationContent,
                userEmail: user.email,
            }))
        );

        res.status(200).json({
            message: "Qualifying exam created successfully",
            exam: exam[0],
        });
    })
);
