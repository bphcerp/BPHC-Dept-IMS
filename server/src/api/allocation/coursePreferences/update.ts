import db from "@/config/db/index.ts";
import { coursePreferences } from "@/config/db/schema/allocation.ts"; 
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq } from "drizzle-orm";
import { updateCoursePreferencesSchema } from "node_modules/lib/src/schemas/Allocation.ts";

const router = express.Router();

router.put(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    const parsed = updateCoursePreferencesSchema.parse(req.body);

    const coursePreferenceExists = await db.query.coursePreferences.findFirst({
      where: (c, { eq }) => eq(c.id, parsed.id),
    });

    if (!coursePreferenceExists) {
      return next(
        new HttpError(HttpCode.NOT_FOUND, "Course not found for given code")
      );
    }

    const { id, ...updates } = parsed;

    if (Object.keys(updates).length === 0) {
      return next(
        new HttpError(HttpCode.BAD_REQUEST, "No fields provided to update")
      );
    }

    const updated = await db
      .update(coursePreferences)
      .set({
        ...updates,
        updatedAt: new Date(), 
      })
      .where(eq(coursePreferences.id, id))
      .returning();

    res.status(200).json(updated);
  })
);

export default router;
