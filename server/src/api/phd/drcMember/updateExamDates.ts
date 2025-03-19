import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import z from "zod";
import { eq } from "drizzle-orm";

const router = express.Router();

// Schema for batch update with email-to-date mapping
const updateBatchExamDatesSchema = z.object({
    examDates: z.record(z.string().email(), z.string().datetime()),
    roomNumber: z.string()
});

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = updateBatchExamDatesSchema.parse(req.body);
        
        const emails = Object.keys(parsed.examDates);
        
        if (emails.length === 0) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "No student emails provided"));
        }

        // Process each student individually to handle different attempt numbers
        const updatePromises = emails.map(async (email) => {
            const examDate = new Date(parsed.examDates[email]);
            
            // Get the student to check the attempt number
            const student = await db
                .select({
                    numberOfQeApplication: phd.numberOfQeApplication
                })
                .from(phd)
                .where(eq(phd.email, email))
                .limit(1);
            
            if (student.length === 0) {
                return null;
            }
            
            const attemptNumber = student[0].numberOfQeApplication || 0;
            
            // Update based on attempt number
            let updateData = {};
            if (attemptNumber <= 1) {
                updateData = { qualifyingExam1Date: examDate };
            } else {
                updateData = { qualifyingExam2Date: examDate };
            }
            
            return db
                .update(phd)
                .set(updateData)
                .where(eq(phd.email, email))
                .returning();
        });
        
        const results = await Promise.all(updatePromises);
        const updatedStudents = results.filter(Boolean).flat();
        
        if (updatedStudents.length === 0) {
            return next(new HttpError(HttpCode.NOT_FOUND, "No PhD records found"));
        }

        res.json({ 
            success: true, 
            count: updatedStudents.length,
            students: updatedStudents
        });
    })
);

export default router;