import { Router } from "express";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { z } from "zod";
import db from "@/config/db/index.ts";
import { instructorSupervisorGrades } from "@/config/db/schema/phd.ts";
import { faculty } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import logger from "@/config/logger.ts";

const router = Router();

const assignStudentInstructorSchema = z.object({
    studentErpId: z.string().min(1),
    courseName: z.string().min(1),
    instructorEmail: z.string().email(),
    campusId: z.string().optional(),
    studentName: z.string().optional(),
});

router.post(
    "/",
    checkAccess("grades:assign"),
    asyncHandler(async (req, res, next) => {
        const { studentErpId, courseName, instructorEmail, campusId, studentName } = assignStudentInstructorSchema.parse(req.body);

        const instructor = await db.query.faculty.findFirst({
            where: eq(faculty.email, instructorEmail),
            columns: { email: true, name: true },
        });

        if (!instructor) {
            return next(new HttpError(HttpCode.NOT_FOUND, "Instructor not found"));
        }

        try {
            await db.insert(instructorSupervisorGrades)
                .values({
                    studentErpId,
                    campusId,
                    studentName,
                    instructorSupervisorEmail: instructorEmail,
                    courseName,
                    role: 'instructor',
                })
                .onConflictDoUpdate({
                    target: [instructorSupervisorGrades.studentErpId, instructorSupervisorGrades.courseName],
                    set: {
                        campusId,
                        studentName,
                        instructorSupervisorEmail: instructorEmail,
                        role: 'instructor',
                        updatedAt: new Date(),
                    },
                });

            res.json({
                success: true,
                message: `Assigned ${instructor.name} (${instructorEmail}) to student ${studentErpId} for course ${courseName}`,
                data: {
                    studentErpId,
                    instructorEmail,
                    instructorName: instructor.name,
                    courseName,
                },
            });
        } catch (error) {
            logger.error("Error assigning instructor:", error);
            return next(new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Failed to assign instructor"));
        }
    })
);

export default router;
