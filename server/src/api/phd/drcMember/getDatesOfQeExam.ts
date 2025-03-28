import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import {  phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { eq, and , desc} from "drizzle-orm";

const router = express.Router();

export default router.get(
    "/:semesterId",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const semesterId = Number(req.params.semesterId);
        if (!semesterId) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid semester ID");
        }

        const latestExam = await db
            .select({
                id: phdQualifyingExams.id,
                examName: phdQualifyingExams.examName,
                examStartDate: phdQualifyingExams.examStartDate,
                examEndDate: phdQualifyingExams.examEndDate
            })
            .from(phdQualifyingExams)
            .where(
                and(eq(phdQualifyingExams.semesterId, semesterId),
                eq(phdQualifyingExams.examName, "Regular Qualifying Exam"))
            )
            .orderBy(desc(phdQualifyingExams.createdAt)) 
            .limit(1);

        if (latestExam.length === 0) {
            throw new HttpError(HttpCode.NOT_FOUND, "No Regular Qualifying Exam found for this semester");
        }

        res.status(200).json({
            success: true,
            exam: latestExam[0],
        });
    })
);
