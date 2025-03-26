import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdCourses } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import assert from "assert";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        assert(req.user);

        // Use the logged-in user's email to fetch their course records
        const existingCourses = await db
            .select()
            .from(phdCourses)
            .where(eq(phdCourses.studentEmail, req.user.email))
            .limit(1);

        if (existingCourses.length === 0) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "PhD course record not found")
            );
        }

        const courseRecord = existingCourses[0];
        const courseGrades = courseRecord.courseGrades ?? [];

        // Check if all grades are valid (not empty, not NC/nc, and not '-')
        const allGraded = courseGrades.length > 0 && courseGrades.every(grade => {
            if (!grade) return false;
            const normalizedGrade = grade.trim().toLowerCase();
            return normalizedGrade !== 'nc' && normalizedGrade !== '-';
        });

        res.json({ 
            allCoursesGraded: allGraded,
            totalCourses: courseGrades.length,
            gradedCourses: courseGrades.filter(grade => {
                const normalizedGrade = grade.trim().toLowerCase();
                return grade && normalizedGrade !== 'nc' && normalizedGrade !== '-';
            }).length
        });
    })
);