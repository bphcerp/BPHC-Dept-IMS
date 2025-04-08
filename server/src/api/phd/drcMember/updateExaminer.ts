import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdExaminer, phdSubAreas } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = express.Router();

router.post(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    const examinerSchema = z.object({
      subAreaId: z.number().int().positive(),
      examinerEmail: z.string().email()
    });

    const parsed = examinerSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        new HttpError(HttpCode.BAD_REQUEST, "Invalid input format", parsed.error.message)
      );
    }

    const { subAreaId, examinerEmail } = parsed.data;

    // Check if the sub area exists
    const subArea = await db.query.phdSubAreas.findFirst({
      where: eq(phdSubAreas.id, subAreaId)
    });

    if (!subArea) {
      return next(
        new HttpError(HttpCode.NOT_FOUND, "Sub area not found")
      );
    }

    // Check if examiner entry exists for this sub area
    const existingExaminer = await db.query.phdExaminer.findFirst({
      where: eq(phdExaminer.subAreaId, subAreaId)
    });

    if (existingExaminer) {
      // Update existing entry
      await db
        .update(phdExaminer)
        .set({ examiner: examinerEmail })
        .where(eq(phdExaminer.subAreaId, subAreaId));
    } else {
      // Create new entry
      await db.insert(phdExaminer).values({
        subAreaId,
        examiner: examinerEmail,
        suggestedExaminer: [examinerEmail]
      });
    }

    res.status(200).json({
      success: true,
      message: "Examiner updated successfully"
    });
  })
);

export default router;