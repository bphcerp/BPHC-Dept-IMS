import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSchemas } from "lib";
import { phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { examId, examinerCount } =
            phdSchemas.updateExaminerCountSchema.parse(req.body);

        const exam = await db.query.phdQualifyingExams.findFirst({
            where: eq(phdQualifyingExams.id, examId),
        });

        if (!exam) {
            return next(new HttpError(HttpCode.NOT_FOUND, "Exam not found"));
        }

        await db
            .update(phdQualifyingExams)
            .set({ examinerCount })
            .where(eq(phdQualifyingExams.id, examId));

        res.status(200).json({
            success: true,
            message: `Examiner count updated to ${examinerCount}`,
        });
    })
);
