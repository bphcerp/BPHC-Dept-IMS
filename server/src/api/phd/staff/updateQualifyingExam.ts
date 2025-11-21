import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { phdSchemas } from "lib";

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

        res.status(200).json({
            message: "Qualifying exam created successfully",
            exam: exam[0],
        });
    })
);
