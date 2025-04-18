import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdExaminer, phdSubAreas } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";
import assert from "node:assert";

const suggestedExaminerSchema = z.object({
    studentEmail: z.string().email(),
    subAreaId: z.number().int().positive(),
    suggestedExaminers: z.array(z.string().email()).min(1).max(4),
});

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const supervisorEmail = req.user.email;
        const parsed = suggestedExaminerSchema.safeParse(req.body);
        if (!parsed.success) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Invalid input format",
                    parsed.error.message
                )
            );
        }

        const { studentEmail, subAreaId, suggestedExaminers } = parsed.data;

        // Check if the student exists
        const student = await db.query.phd.findFirst({
            where: eq(phd.email, studentEmail),
        });

        if (!student) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "PhD student not found")
            );
        }

        // Check if the supervisor is actually the student's supervisor
        if (student.supervisorEmail !== supervisorEmail) {
            return next(
                new HttpError(
                    HttpCode.FORBIDDEN,
                    "You are not this student's supervisor"
                )
            );
        }

        // Check if the sub area exists
        const subArea = await db.query.phdSubAreas.findFirst({
            where: eq(phdSubAreas.id, subAreaId),
        });

        if (!subArea) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Sub area not found")
            );
        }

        // Check if this sub area is actually assigned to the student
        // We need to compare the subarea name with the qualifying areas stored for the student
        if (
            student.qualifyingArea1 !== subArea.subarea &&
            student.qualifyingArea2 !== subArea.subarea
        ) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "This sub area is not assigned to the student"
                )
            );
        }

        // Check if examiner entry exists for this sub area
        const existingExaminer = await db.query.phdExaminer.findFirst({
            where: eq(phdExaminer.subAreaId, subAreaId),
        });

        if (existingExaminer) {
            // Update existing entry
            await db
                .update(phdExaminer)
                .set({ suggestedExaminer: suggestedExaminers })
                .where(eq(phdExaminer.subAreaId, subAreaId));
        } else {
            // Create new entry
            await db.insert(phdExaminer).values({
                subAreaId,
                suggestedExaminer: suggestedExaminers,
                studentEmail: studentEmail,
            });
        }

        res.status(200).json({
            success: true,
            message: "Suggested examiners updated successfully",
        });
    })
);

export default router;
