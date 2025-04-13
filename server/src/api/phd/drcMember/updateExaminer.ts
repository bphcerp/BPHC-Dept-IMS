import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdExaminer, phdSubAreas } from "@/config/db/schema/phd.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const examinerSchema = z.object({
            subAreaId: z.number().int().positive(),
            examinerEmail: z.string().email(),
            studentEmail: z.string().email(),
        });

        const parsed = examinerSchema.safeParse(req.body);
        if (!parsed.success) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Invalid input format",
                    parsed.error.message
                )
            );
        }

        const { subAreaId, examinerEmail, studentEmail } = parsed.data;

        const subArea = await db.query.phdSubAreas.findFirst({
            where: eq(phdSubAreas.id, subAreaId),
        });

        if (!subArea) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Sub area not found")
            );
        }

        // Check if the student exists
        const student = await db.query.phd.findFirst({
            where: eq(phd.email, studentEmail),
        });

        if (!student) {
            return next(new HttpError(HttpCode.NOT_FOUND, "Student not found"));
        }

        // Check if examiner entry already exists for this student and subarea
        const existingExaminer = await db.query.phdExaminer.findFirst({
            where: and(
                eq(phdExaminer.subAreaId, subAreaId),
                eq(phdExaminer.studentEmail, studentEmail)
            ),
        });

        if (existingExaminer) {
            await db
                .update(phdExaminer)
                .set({ examiner: examinerEmail })
                .where(
                    and(
                        eq(phdExaminer.subAreaId, subAreaId),
                        eq(phdExaminer.studentEmail, studentEmail)
                    )
                );
        } else {
            await db.insert(phdExaminer).values({
                subAreaId,
                studentEmail,
                examiner: examinerEmail,
                suggestedExaminer: [examinerEmail],
            });
        }

        res.status(200).json({
            success: true,
            message: "Examiner updated successfully",
        });
    })
);

export default router;
