import db from "@/config/db/index.ts";
import { coursePreferences } from "@/config/db/schema/allocation.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";

const router = express.Router();

const deleteCoursePreferenceSchema = z.object({
    id: z.string().uuid() 
});

router.delete(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = deleteCoursePreferenceSchema.parse(req.body);

        const allocationExists = await db.query.coursePreferences.findFirst({
            where: (alloc, { eq }) => eq(alloc.id, parsed.id),
        });

        if (!allocationExists) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Course not found for given ID")
            );
        }

        await db
            .delete(coursePreferences)
            .where(eq(coursePreferences.id, parsed.id))
            .returning();

        res.status(200).json({ success: true });
    })
);

export default router;
