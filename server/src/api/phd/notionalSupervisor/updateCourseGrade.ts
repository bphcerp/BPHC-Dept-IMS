import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdCourses } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import assert from "assert";
import z from "zod";

const router = express.Router();

const updatePhdGradesSchema = z.object({
    studentEmail: z.string().email(),
    courseGrades: z.array(z.string()),
});

export default router.put(
    "/grades",
    checkAccess("notional-supervisor-update-grades"),
    asyncHandler(async (req, res, next) => {
        assert(req.user);

        const parsed = updatePhdGradesSchema.parse(req.body);

        const updated = await db
            .update(phdCourses)
            .set({
                courseGrades: parsed.courseGrades,
            })
            .where(eq(phdCourses.studentEmail, parsed.studentEmail))
            .returning();

        if (updated.length === 0) {
            return next(new HttpError(HttpCode.NOT_FOUND, "PhD course record not found"));
        }

        res.json({ success: true, phdCourses: updated[0] });
    })
);