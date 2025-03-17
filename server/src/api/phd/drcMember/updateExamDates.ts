import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import z from "zod";
import { eq } from "drizzle-orm";

const router = express.Router();

const updateExamDatesSchema = z.object({
    email: z.string().email(),
    qualifyingExam1Date: z.string().datetime().optional().nullable(),
    qualifyingExam2Date: z.string().datetime().optional().nullable(),
});

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = updateExamDatesSchema.parse(req.body);

        const updated = await db
            .update(phd)
            .set({
                qualifyingExam1Date: parsed.qualifyingExam1Date
                    ? new Date(parsed.qualifyingExam1Date)
                    : null,
                qualifyingExam2Date: parsed.qualifyingExam2Date
                    ? new Date(parsed.qualifyingExam2Date)
                    : null,
            })
            .where(eq(phd.email, parsed.email))
            .returning();

        if (updated.length === 0) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "PhD record not found")
            );
        }

        res.json({ success: true, phd: updated[0] });
    })
);

export default router;
