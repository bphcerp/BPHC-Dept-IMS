import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdSemesters, phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { eq, and, gt } from "drizzle-orm";
import {phdSchemas} from "lib"

const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = phdSchemas.updateQualifyingExamSchema.parse(req.body);
        const { semesterId, examName, examStartDate, examEndDate, deadline } = parsed;

        const semester = await db
            .select()
            .from(phdSemesters)
            .where(eq(phdSemesters.id, semesterId))
            .limit(1);

        if (semester.length === 0) {
            throw new HttpError(HttpCode.NOT_FOUND, "Semester not found");
        }

        if (!examStartDate || !examEndDate || !deadline) {
            throw new HttpError(HttpCode.BAD_REQUEST, "All dates must be provided");
        }

        const existingActiveExams = await db
            .select()
            .from(phdQualifyingExams)
            .where(
                and(
                eq(phdQualifyingExams.semesterId, semesterId),
                eq(phdQualifyingExams.examName, examName),
                gt(phdQualifyingExams.deadline, new Date()) // deadline not passed
                )
            );

            if (existingActiveExams.length > 0) {
            throw new HttpError(
                HttpCode.BAD_REQUEST, 
                "An active exam deadline already exists for this semester. Please cancel the existing deadline first."
            );
            }
        
            const deadlineDate = new Date(deadline);
            const startDate = new Date(examStartDate);
            const endDate = new Date(examEndDate);
        
            if (deadlineDate >= startDate) {
              throw new HttpError(
                HttpCode.BAD_REQUEST, 
                "Registration deadline must be before exam start date"
              );
            }
        
            if (startDate >= endDate) {
              throw new HttpError(
                HttpCode.BAD_REQUEST, 
                "Exam start date must be before exam end date"
              );
            }
        
        const newExam = await db
            .insert(phdQualifyingExams)
            .values({
                semesterId,
                examName,
                examStartDate: startDate,
                examEndDate: endDate,
                deadline: deadlineDate,
            })
            .returning();

        res.status(201).json({
            success: true,
            message: "Qualifying exam created successfully",
            exam: newExam[0],
        });
    })
);
