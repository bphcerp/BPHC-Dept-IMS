import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdSchemas } from "lib";
import { eq, sql } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = phdSchemas.updateExamStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Invalid input data")
            );
        }

        const studentsToUpdate = parsed.data;
        if (studentsToUpdate.length === 0) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "No students to update")
            );
        }

        const studentRecords = await db.query.phd.findMany({
            where: sql`${phd.email} IN (${sql.join(
                studentsToUpdate.map((s) => s.email),
                sql`, `
            )})`,
        });

        if (studentRecords.length === 0) {
            return next(new HttpError(HttpCode.NOT_FOUND, "No students found"));
        }

        const updates = [];
        const updatedStudents = [];

        for (const student of studentsToUpdate) {
            const existingStudent = studentRecords.find(
                (s) => s.email === student.email
            );
            if (!existingStudent) continue;

            const updateData: { qualifyingExam1?: boolean; qualifyingExam2?: boolean } = {};

            // Determine which exam to update based on numberOfQeApplication
            if (existingStudent.numberOfQeApplication === 1) {
                // For first QE application, update exam 1
                updateData.qualifyingExam1 = student.ifPass;
            } else if (existingStudent.numberOfQeApplication === 2) {
                // For second QE application, update exam 2
                updateData.qualifyingExam2 = student.ifPass;
            } else {
                // If no valid number of applications, skip this student
                continue;
            }

            updates.push(
                db
                    .update(phd)
                    .set(updateData)
                    .where(eq(phd.email, student.email))
            );

            updatedStudents.push({
                email: student.email,
                ...(updateData.qualifyingExam1 !== undefined 
                    ? { qualifyingExam1: updateData.qualifyingExam1 } 
                    : { qualifyingExam2: updateData.qualifyingExam2 }
                ),
            });
        }

        if (updates.length > 0) {
            await Promise.all(updates);
        }

        res.status(200).json({
            success: true,
            updatedCount: updates.length,
            updatedStudents,
            message: `${updates.length} student exam results updated successfully.`,
        });
    })
);

export default router;