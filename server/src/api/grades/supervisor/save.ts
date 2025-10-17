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
    topic: z.string().optional(),
});

router.post(
    "/",
    checkAccess("grades:supervisor:save"),
    asyncHandler(async (req, res, next) => {
        const supervisorEmail = req.user?.email;
        if (!supervisorEmail) {
            return next(new HttpError(HttpCode.UNAUTHORIZED, "Unauthenticated"));
        }
        const { studentErpId, courseName, midsemGrade, compreGrade, midsemMarks, endsemMarks, topic } = payloadSchema.parse(req.body);

        const existing = await db.query.instructorSupervisorGrades.findFirst({
            where: (t) => and(
                eq(t.studentErpId, studentErpId),
                eq(t.courseName, courseName),
                eq(t.instructorSupervisorEmail, supervisorEmail),
                eq(t.role, 'supervisor')
            ),
        });

        if (!existing) {
            const student = await db.query.phd.findFirst({
                where: (phd) => and(
                    eq(phd.erpId, studentErpId),
                    eq(phd.supervisorEmail, supervisorEmail)
                ),
            });

            if (student) {
                await db.insert(instructorSupervisorGrades).values({
                    studentErpId,
                    instructorSupervisorEmail: supervisorEmail,
                    courseName,
                    role: 'supervisor',
                    midsemGrade: midsemGrade || null,
                    compreGrade: compreGrade || null,
                    midsemMarks: midsemMarks || null,
                    endsemMarks: endsemMarks || null,
                    topic: topic || null,
                });
                res.json({ success: true, message: "Grade saved successfully" });
                return;
            } else {
                return next(new HttpError(HttpCode.FORBIDDEN, "Not allowed for this student/course"));
            }
        }

        await db.update(instructorSupervisorGrades)
            .set({
                midsemGrade: midsemGrade || null,
                compreGrade: compreGrade || null,
                midsemMarks: midsemMarks || null,
                endsemMarks: endsemMarks || null,
                topic: topic || null,
                updatedAt: new Date(),
            })
            .where(and(
                eq(instructorSupervisorGrades.studentErpId, studentErpId),
                eq(instructorSupervisorGrades.courseName, courseName),
                eq(instructorSupervisorGrades.instructorSupervisorEmail, supervisorEmail),
                eq(instructorSupervisorGrades.role, 'supervisor')
            ));

        res.json({ success: true, message: "Grade saved successfully" });
    })
);

export default router;