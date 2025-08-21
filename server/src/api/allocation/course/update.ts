import db from "@/config/db/index.ts";
import { course } from "@/config/db/schema/allocation.ts"; 
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { courseSchema as updateCourseSchema } from "node_modules/lib/src/schemas/Allocation.ts";
const router = express.Router();




router.put(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    const parsed = updateCourseSchema.parse(req.body);

    const courseExists = await db.query.course.findFirst({
      where: (c, { eq }) => eq(c.code, parsed.code),
    });

    if (!courseExists) {
      return next(
        new HttpError(HttpCode.NOT_FOUND, "Course not found for given code")
      );
    }

    const { code, ...updates } = parsed;

    if (Object.keys(updates).length === 0) {
      return next(
        new HttpError(HttpCode.BAD_REQUEST, "No fields provided to update")
      );
    }

    const updated = await db
      .update(course)
      .set({
        ...updates,
        updatedAt: new Date(), 
      })
      .where(eq(course.code, code))
      .returning();

    res.status(200).json(updated);
  })
);

export default router;
