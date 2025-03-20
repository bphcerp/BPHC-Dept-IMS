import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdSemesters, phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { eq, and } from "drizzle-orm";

const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { semesterId, examName, deadline } = req.body;
        // Check if semester exists
        const semester = await db
            .select()
            .from(phdSemesters)
            .where(eq(phdSemesters.id, semesterId))
            .limit(1);

        if (semester.length === 0) {
            throw new HttpError(HttpCode.NOT_FOUND, "Semester not found");
        }

        // Check if exam with the same name exists for this semester
        const existingExam = await db
            .select()
            .from(phdQualifyingExams)
            .where(
                and(
                    eq(phdQualifyingExams.semesterId, semesterId),
                    eq(phdQualifyingExams.examName, examName)
                )
            )
            .limit(1);

        if (existingExam.length > 0) {
            // Update existing exam
            await db
                .update(phdQualifyingExams)
                .set({
                    deadline: new Date(deadline),
                })
                .where(eq(phdQualifyingExams.id, existingExam[0].id));

            res.status(200).json({
                success: true,
                message: "Qualifying exam deadline updated successfully",
                exam: {
                    ...existingExam[0],
                    deadline: new Date(deadline),
                },
            });
        } else {
            // Create new exam
            const newExam = await db
                .insert(phdQualifyingExams)
                .values({
                    semesterId,
                    examName,
                    deadline: new Date(deadline),
                })
                .returning();

            res.status(201).json({
                success: true,
                message: "Qualifying exam deadline created successfully",
                exam: newExam[0],
            });
        }
    })
);
