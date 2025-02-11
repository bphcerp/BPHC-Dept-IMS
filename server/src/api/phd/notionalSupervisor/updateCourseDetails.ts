import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import {  phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import assert from "assert";
import z from "zod";
import {phdCourses} from "@/config/db/schema/phd.ts"

const router = express.Router();

const updatePhdCoursesSchema = z.object({
    studentEmail: z.string().email(),
    courseNames: z.array(z.string()),
    courseUnits: z.array(z.number()),
});

export default router.post(
    "/",
    checkAccess("notional-supervisor-update-courses"),
    asyncHandler(async (req, res, next) => {
        assert(req.user);

        const parsed = updatePhdCoursesSchema.parse(req.body);

        const phdStudent = await db
            .select()
            .from(phd)
            .where(eq(phd.email, parsed.studentEmail))
            .limit(1);

        if (phdStudent.length === 0) {
            return next(new HttpError(HttpCode.NOT_FOUND, "PhD student not found"));
        }

        // check for notional supervisor specifics
        if (phdStudent[0].notionalSupervisorEmail !== req.user.email) {
            return next(new HttpError(HttpCode.FORBIDDEN, "You are not the notional supervisor of this student"));
        }

        const updated = await db
            .update(phdCourses)
            .set({
                courseNames: parsed.courseNames,
                courseUnits: parsed.courseUnits,
            })
            .where(eq(phdCourses.studentEmail, parsed.studentEmail))
            .returning();

        if (updated.length === 0) {
            return next(new HttpError(HttpCode.NOT_FOUND, "PhD course record not found"));
        }

        res.json({ success: true, phdCourses: updated[0] });
    })
);