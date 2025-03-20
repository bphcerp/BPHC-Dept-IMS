import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSemesters } from "@/config/db/schema/phd.ts";
import { and, gte, lte, desc, asc } from "drizzle-orm";

const router = express.Router();

export default router.get(
    "/",
    checkAccess("drc"),
    asyncHandler(async (_req, res) => {
        const currentDate = new Date();

        // Find semester that encompasses the current date
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
                return;
            }

            res.status(404).json({
                success: false,
                message: "No semester found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            semester: currentSemester[0],
            isActive: true,
        });
    })
);
