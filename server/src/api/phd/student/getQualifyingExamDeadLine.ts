import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSemesters, phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { eq, gt, and } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const now = new Date();
        const name = typeof req.query.name === "string" ? req.query.name : null;

        if (!name) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Name is required"));
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
            .where(and(gt(phdQualifyingExams.deadline, now), eq(phdQualifyingExams.examName, name)))
            .orderBy(phdQualifyingExams.deadline);

        res.status(200).json({
            success: true,
            exams,
        });
    })
);

export default router;
