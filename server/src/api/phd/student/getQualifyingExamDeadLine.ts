import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSemesters, phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { eq, gt } from "drizzle-orm";

const router = express.Router();

export default router.get(
    "/",
    checkAccess("phd"),
    asyncHandler(async (_req, res) => {
        const now = new Date();
        const exams = await db
            .select({
                id: phdQualifyingExams.id,
                examName: phdQualifyingExams.examName,
                deadline: phdQualifyingExams.deadline,
                semesterYear: phdSemesters.year,
                semesterNumber: phdSemesters.semesterNumber,
            })
            .from(phdQualifyingExams)
            .innerJoin(
                phdSemesters,
                eq(phdQualifyingExams.semesterId, phdSemesters.id)
            )
            .where(gt(phdQualifyingExams.deadline, now))
            .orderBy(phdQualifyingExams.deadline);

        res.status(200).json({
            success: true,
            exams,
        });
    })
);
