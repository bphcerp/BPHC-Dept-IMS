import db from "@/config/db/index.ts";
import { course } from "@/config/db/schema/allocation.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { deleteCourseSchema } from "node_modules/lib/src/schemas/Allocation.ts";


const router = express.Router();



router.delete(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = deleteCourseSchema.parse(req.body);

        const allocationExists = await db.query.course.findFirst({
            where: (alloc, { eq }) => eq(alloc.code, parsed.code),
        });

        if (!allocationExists) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Course not found for given ID")
            );
        }

        await db
            .delete(course)
            .where(eq(course.code, parsed.code))
            .returning();

        res.status(200).json({ success: true });
    })
);

export default router;
