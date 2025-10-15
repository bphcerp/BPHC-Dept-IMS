import { Router } from "express";
import db from "@/config/db/index.ts";
import { instructorSupervisorGrades } from "@/config/db/schema/phd.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

const router = Router();

const payloadSchema = z.object({
    studentErpId: z.string().min(1),
    courseName: z.string().min(1),
    midsemGrade: z.string().optional(),
    compreGrade: z.string().optional(),
    midsemMarks: z.number().int().min(0).max(100).optional(),
    endsemMarks: z.number().int().min(0).max(100).optional(),
});

router.post(
    "/",
    checkAccess("grades:instructor:save"),
    asyncHandler(async (req, res, next) => {
        const instructorEmail = req.user?.email;
        if (!instructorEmail) {
            return next(new HttpError(HttpCode.UNAUTHORIZED, "Unauthenticated"));
        }
        const { studentErpId, courseName, midsemGrade, compreGrade, midsemMarks, endsemMarks } = payloadSchema.parse(req.body);

        const existing = await db.query.instructorSupervisorGrades.findFirst({
            where: (t) => and(
                eq(t.studentErpId, studentErpId),
                eq(t.courseName, courseName),
                eq(t.instructorSupervisorEmail, instructorEmail),
                eq(t.role, 'instructor')
            ),
        });

        if (!existing) {
            return next(new HttpError(HttpCode.FORBIDDEN, "Not allowed for this student/course"));
        }

        await db.update(instructorSupervisorGrades)
            .set({
                midsemGrade: midsemGrade || null,
                compreGrade: compreGrade || null,
                midsemMarks: midsemMarks || null,
                endsemMarks: endsemMarks || null,
                updatedAt: new Date(),
            })
            .where(and(
                eq(instructorSupervisorGrades.studentErpId, studentErpId),
                eq(instructorSupervisorGrades.courseName, courseName),
                eq(instructorSupervisorGrades.instructorSupervisorEmail, instructorEmail),
                eq(instructorSupervisorGrades.role, 'instructor')
            ));

        res.json({ success: true, message: "Grade saved successfully" });
    })
);

export default router;
