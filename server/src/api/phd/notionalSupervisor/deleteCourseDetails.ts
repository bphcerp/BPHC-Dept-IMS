import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { eq } from "drizzle-orm";
import assert from "assert";
import { phdCourses } from "@/config/db/schema/phd.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdSchemas } from "lib";

const router = express.Router();

export default router.delete(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        assert(req.user);

        const parsed = phdSchemas.deletePhdCourseBodySchema.safeParse(req.body);
        if (!parsed.success) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Invalid request body")
            );
        }

        const { studentEmail, courseId } = parsed.data;

        const phdStudent = await db
            .select()
            .from(phd)
            .where(eq(phd.email, studentEmail))
            .limit(1);

        if (phdStudent.length === 0) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "PhD student not found")
            );
        }

        if (phdStudent[0].notionalSupervisorEmail !== req.user.email) {
            return next(
                new HttpError(
                    HttpCode.FORBIDDEN,
                    "You are not the notional supervisor of this student"
                )
            );
        }

        const existingCourses = await db
            .select()
            .from(phdCourses)
            .where(eq(phdCourses.studentEmail, studentEmail))
            .limit(1);

        if (existingCourses.length === 0) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "PhD course record not found")
            );
        }

        const courseRecord = existingCourses[0];

        const currentCourseIds = courseRecord.courseIds ?? [];
        const currentCourseNames = courseRecord.courseNames ?? [];
        const currentCourseUnits = courseRecord.courseUnits ?? [];
        const currentCourseGrades = courseRecord.courseGrades ?? [];

        const index = currentCourseIds.indexOf(courseId);

        if (index === -1) {
            return next(new HttpError(HttpCode.NOT_FOUND, "Course not found"));
        }

        const updatedCourseIds = currentCourseIds.filter((_, i) => i !== index);
        const updatedCourseNames = currentCourseNames.filter(
            (_, i) => i !== index
        );
        const updatedCourseUnits = currentCourseUnits.filter(
            (_, i) => i !== index
        );
        const updatedCourseGrades = currentCourseGrades.filter(
            (_, i) => i !== index
        );

        const updated = await db
            .update(phdCourses)
            .set({
                courseIds: updatedCourseIds,
                courseNames: updatedCourseNames,
                courseUnits: updatedCourseUnits,
                courseGrades: updatedCourseGrades,
            })
            .where(eq(phdCourses.studentEmail, studentEmail))
            .returning();

        res.json({ success: true, phdCourses: updated[0] });
    })
);
