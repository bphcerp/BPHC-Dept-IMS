import { Router } from "express";
import db from "@/config/db/index.ts";
import { phdSupervisorGrades } from "@/config/db/schema/phd.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

const router = Router();

const payloadSchema = z.object({
    studentEmail: z.string().email(),
    courseName: z.string().min(1),
    midsemGrade: z.string().optional(),
    compreGrade: z.string().optional(),
    midsemMarks: z.number().int().min(0).max(100).optional(),
    endsemMarks: z.number().int().min(0).max(100).optional(),
});

router.post(
    "/",
    checkAccess("grades:supervisor:save"),
    asyncHandler(async (req, res, next) => {
        const supervisorEmail = req.user?.email;
        if (!supervisorEmail) {
            return next(new HttpError(HttpCode.UNAUTHORIZED, "Unauthenticated"));
        }
        const { studentEmail, courseName, midsemGrade, compreGrade, midsemMarks, endsemMarks } = payloadSchema.parse(req.body);

        const student = await db.query.phd.findFirst({
            where: (phd) => and(eq(phd.email, studentEmail), eq(phd.supervisorEmail, supervisorEmail)),
            columns: { email: true },
        });
        if (!student) {
            return next(new HttpError(HttpCode.FORBIDDEN, "Not allowed for this student"));
        }

        const existing = await db.query.phdSupervisorGrades.findFirst({
            where: (t) => and(eq(t.studentEmail, studentEmail), eq(t.courseName, courseName)),
        });

        if (existing) {
            await db
                .update(phdSupervisorGrades)
                .set({ midsemGrade, compreGrade, midsemMarks, endsemMarks, supervisorEmail })
                .where(eq(phdSupervisorGrades.id, existing.id));
        } else {
            await db.insert(phdSupervisorGrades).values({
                studentEmail,
                supervisorEmail,
                courseName,
                midsemGrade,
                compreGrade,
                midsemMarks,
                endsemMarks,
            });
        }

        res.json({ success: true });
    })
);

export default router;


