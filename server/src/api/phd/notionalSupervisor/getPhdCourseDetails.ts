import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdCourses } from "@/config/db/schema/phd.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import assert from "assert";

const router = express.Router();

export default router.get(
    "/",
    checkAccess("notional-supervisor-view-courses"),
    asyncHandler(async (req, res, next) => {
        assert(req.user); 
        const { studentEmail } = req.query;

        if (!studentEmail) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Student email is required"));
        }
        const phdStudent = await db
            .select()
            .from(phd)
            .where(eq(phd.email, studentEmail as string))
            .limit(1);

        if (phdStudent.length === 0) {
            return next(new HttpError(HttpCode.NOT_FOUND, "PhD student not found"));
        }

        if (phdStudent[0].notionalSupervisorEmail !== req.user.email) {
            return next(new HttpError(HttpCode.FORBIDDEN, "You are not the notional supervisor of this student"));
        }

        const studentCourses = await db
            .select()
            .from(phdCourses)
            .where(eq(phdCourses.studentEmail, studentEmail as string))
            .limit(1);

        if (studentCourses.length === 0) {
            return next(new HttpError(HttpCode.NOT_FOUND, "No courses found for this student"));
        }

        res.json({ success: true, courses: studentCourses[0] });
    })
);