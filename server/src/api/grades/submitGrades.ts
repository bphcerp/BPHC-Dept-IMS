import { Router } from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { instructorSupervisorGrades } from "@/config/db/schema/phd.ts";
import { completeTodo } from "@/lib/todos/index.ts";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const submitGradesSchema = z.object({
    studentErpId: z.string().min(1),
    courseName: z.string().min(1),
    midsemGrade: z.string().optional(),
    compreGrade: z.string().optional(),
    midsemMarks: z.number().optional(),
    endsemMarks: z.number().optional(),
    topic: z.string().optional(),
});

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { studentErpId, courseName, midsemGrade, compreGrade, midsemMarks, endsemMarks, topic } = submitGradesSchema.parse(req.body);

        const existingGrade = await db.query.instructorSupervisorGrades.findFirst({
            where: and(
                eq(instructorSupervisorGrades.studentErpId, studentErpId),
                eq(instructorSupervisorGrades.courseName, courseName),
                eq(instructorSupervisorGrades.instructorSupervisorEmail, req.user!.email)
            ),
        });

        if (!existingGrade) {
            res.status(404).json({
                success: false,
                message: "Grade record not found",
            });
            return;
        }

        await db.update(instructorSupervisorGrades)
            .set({
                midsemGrade,
                compreGrade,
                midsemMarks,
                endsemMarks,
                topic,
                phase: 'draft',
            })
            .where(eq(instructorSupervisorGrades.id, existingGrade.id));

        const instructorEmail = req.user!.email;
        const allInstructorGrades = await db.query.instructorSupervisorGrades.findMany({
            where: and(
                eq(instructorSupervisorGrades.instructorSupervisorEmail, instructorEmail),
                eq(instructorSupervisorGrades.role, 'instructor')
            ),
        });

        const allSubmitted = allInstructorGrades.every(g => g.phase === 'draft');

        if (allSubmitted) {
            const completionEvent = existingGrade.phase === 'midsem'
                ? `grades:midsem-submit:${instructorEmail}`
                : `grades:endsem-submit:${instructorEmail}`;

            await completeTodo({
                module: "Grades" as any,
                completionEvent,
                assignedTo: instructorEmail,
            });
        }

        res.json({
            success: true,
            message: "Grades submitted successfully",
            data: {
                studentErpId,
                courseName,
                phase: 'draft',
                grades: {
                    midsemGrade,
                    compreGrade,
                    midsemMarks,
                    endsemMarks,
                    topic,
                }
            }
        });
    })
);

export default router;
