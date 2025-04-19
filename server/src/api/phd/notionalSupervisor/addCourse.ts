import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq, sql } from "drizzle-orm";
import assert from "assert";
import { phdCourses } from "@/config/db/schema/phd.ts";
import { phdSchemas } from "lib";
const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const parsed = phdSchemas.addPhdCourseBodySchema.safeParse(req.body);
        if (!parsed.success) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Invalid request body")
            );
        }

        const [phdStudent] = await db
            .select()
            .from(phd)
            .where(eq(phd.email, parsed.data.studentEmail))
            .limit(1);
        if (!phdStudent) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "PhD student not found")
            );
        }

        if (phdStudent.notionalSupervisorEmail !== req.user.email) {
            return next(
                new HttpError(
                    HttpCode.FORBIDDEN,
                    "You are not the notional supervisor of this student"
                )
            );
        }

        const [existingCourses] = await db
            .select()
            .from(phdCourses)
            .where(eq(phdCourses.studentEmail, parsed.data.studentEmail))
            .limit(1);

        if (!existingCourses) {
            await db.insert(phdCourses).values({
                studentEmail: parsed.data.studentEmail,
                courseNames: [],
                courseUnits: [],
                courseIds: [],
            });
        }

        const updated = await db
            .update(phdCourses)
            .set({
                courseNames: sql`array_append(${phdCourses.courseNames}, ${sql.join(parsed.data.courses.map((c) => c.name))})`,
                courseUnits: sql`array_append(${phdCourses.courseUnits}, ${sql.join(parsed.data.courses.map((c) => c.units))})`,
                courseIds: sql`array_append(${phdCourses.courseIds}, ${sql.join(parsed.data.courses.map((c) => c.courseId))})`,
            })
            .where(eq(phdCourses.studentEmail, parsed.data.studentEmail))
            .returning();

        res.json({ success: true, phdCourses: updated[0] });
    })
);
