import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSemesters, phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { eq, gt,and } from "drizzle-orm";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const now = new Date();
        const name = typeof req.query.name === "string" ? req.query.name : null;
        if (!name){
            res.status(400).json({
                success: false,
                message: "Name is required",
            });
            return;
        }
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
            .where(and(gt(phdQualifyingExams.deadline, now), name ? eq(phdQualifyingExams.examName, name) : undefined))
            .orderBy(phdQualifyingExams.deadline);

        res.status(200).json({
            success: true,
            exams,
        });
    })
);
