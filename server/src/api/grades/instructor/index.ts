import { Router } from "express";
import db from "@/config/db/index.ts";
import { and, eq, inArray } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = Router();

router.get(
    "/",
    checkAccess("grades:instructor:view"),
    asyncHandler(async (req, res, next) => {
        const instructorEmail = req.user?.email;
        if (!instructorEmail) {
            return next(new HttpError(HttpCode.UNAUTHORIZED, "Unauthenticated"));
        }

        const instructorGrades = await db.query.instructorSupervisorGrades.findMany({
            where: (t) => and(
                eq(t.instructorSupervisorEmail, instructorEmail),
                eq(t.role, 'instructor')
            ),
        });

        const studentErpIds = instructorGrades.map(g => g.studentErpId);
        const courses = [...new Set(instructorGrades.map(g => g.courseName))];

        const students = studentErpIds.length
            ? await db.query.phd.findMany({
                where: (phd) => inArray(phd.erpId, studentErpIds),
                columns: { email: true, name: true, erpId: true, idNumber: true },
            })
            : [];

        res.json({
            success: true,
            data: {
                students,
                grades: instructorGrades,
                courses
            }
        });
    })
);

export default router;

