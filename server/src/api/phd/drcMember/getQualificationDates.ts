import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res, next) => {
        // In Drizzle ORM, you typically need to use a different approach for selecting fields
        const students = await db.query.phd.findMany({
            columns: {
                email: true,
                name: true,
                qualificationDate: true,
                qualifyingExam1: true,
                qualifyingExam2: true,
            },
        });

        if (!students.length) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "No PhD students found")
            );
        }

        res.status(200).json({
            success: true,
            qualificationDates: students.map((student) => ({
                email: student.email,
                name: student.name,
                qualificationDate: student.qualificationDate,
                examStatus: student.qualifyingExam1 ?? student.qualifyingExam2,
            })),
        });
    })
);

export default router;
