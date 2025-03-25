import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSemesters } from "@/config/db/schema/phd.ts";
import { and, gte, lte, desc, asc } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res, next) => {
        const currentDate = new Date();

        const currentSemester = await db
            .select()
            .from(phdSemesters)
            .where(
                and(
                    lte(phdSemesters.startDate, currentDate),
                    gte(phdSemesters.endDate, currentDate)
                )
            )
            .limit(1);

        // If no active semester is found, find the most recent one
        if (currentSemester.length === 0) {
            const mostRecentSemester = await db
                .select()
                .from(phdSemesters)
                .orderBy(
                    asc(phdSemesters.semesterNumber),
                    desc(phdSemesters.year)
                )
                .limit(1);

            if (mostRecentSemester.length > 0) {
                res.status(200).json({
                    success: true,
                    semester: mostRecentSemester[0],
                    isActive: false,
                });
            }

            return next(new HttpError(HttpCode.NOT_FOUND, "No semester found"));
        }

        res.status(200).json({
            success: true,
            semester: currentSemester[0],
            isActive: true,
        });
    })
);

export default router;
