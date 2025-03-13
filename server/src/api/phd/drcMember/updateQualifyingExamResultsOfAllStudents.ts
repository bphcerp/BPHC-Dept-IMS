import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { phd } from "@/config/db/schema/admin.ts";
import {phdSchemas} from "lib";
import { eq, sql } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess("drc-update-exam"),
    asyncHandler(async (req, res, next) => {

        console.log(req.body, "amogussss");

        const parsed = phdSchemas.updateExamStatusSchema.safeParse(req.body);

        if (!parsed.success) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid input data"));
        }

        const studentsToUpdate = parsed.data;

        if (studentsToUpdate.length === 0) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "No students to update"));
        }

        // Fix: Use sql.join() for correct formatting in the IN clause
        const studentRecords = await db.query.phd.findMany({
            where: sql`${phd.email} IN (${sql.join(studentsToUpdate.map((s) => s.email), sql`, `)})`,
        });

        if (studentRecords.length === 0) {
            return next(new HttpError(HttpCode.NOT_FOUND, "No students found"));
        }

        const updates = [];

        for (const student of studentsToUpdate) {
            const existingStudent = studentRecords.find((s) => s.email === student.email);

            if (!existingStudent) continue;

            if (existingStudent.qualifyingExam1 != null && existingStudent.qualifyingExam2 != null) {
                continue; // Skip if both exams are already given
            }

            if (existingStudent.qualifyingExam1 == null) {
                updates.push(
                    db.update(phd)
                        .set({ qualifyingExam1: student.ifPass })
                        .where(eq(phd.email, student.email))
                );
            } else {
                updates.push(
                    db.update(phd)
                        .set({ qualifyingExam2: student.ifPass })
                        .where(eq(phd.email, student.email))
                );
            }
        }

        if (updates.length > 0) {
            await Promise.all(updates);
        }

        res.status(200).json({ status: "success", updatedCount: updates.length });
    })
);


export default router;
