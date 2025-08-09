import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdQualifyingExams, phdSemesters } from "@/config/db/schema/phd.ts";
import { eq, desc } from "drizzle-orm";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const exams = await db
            .select({
                id: phdQualifyingExams.id,
                examName: phdQualifyingExams.examName,
                examStartDate: phdQualifyingExams.examStartDate,
                examEndDate: phdQualifyingExams.examEndDate,
                submissionDeadline: phdQualifyingExams.submissionDeadline,
                vivaDate: phdQualifyingExams.vivaDate,
                semester: {
                    year: phdSemesters.year,
                    semesterNumber: phdSemesters.semesterNumber,
                },
            })
            .from(phdQualifyingExams)
            .innerJoin(
                phdSemesters,
                eq(phdQualifyingExams.semesterId, phdSemesters.id)
            )
            .orderBy(
                desc(phdSemesters.year),
                desc(phdSemesters.semesterNumber),
                desc(phdQualifyingExams.createdAt)
            );

        res.json({
            success: true,
            exams,
        });
    })
);
