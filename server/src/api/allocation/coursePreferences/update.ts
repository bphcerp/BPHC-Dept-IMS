import db from "@/config/db/index.ts";
import { coursePreferences } from "@/config/db/schema/allocation.ts"; 
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";

const router = express.Router();


const updateCoursePreferenceSchema = z.object({
    id: z.string().uuid(),
	instructorEmail: z.string().email(),
	semesterId: z.string().uuid(),
	courseCode: z.string(),
	sectionType: z.enum(["Lecture", "Tutorial", "Practical"]),
	preferences: z.number().int().min(1),
	
});

router.put(
  "/update",
  checkAccess("allocation:course-preferences:update"),
  asyncHandler(async (req, res, next) => {
    const parsed = updateCoursePreferenceSchema.parse(req.body);

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

    res.status(200).json({ success: true, data: updated[0] });
  })
);

export default router;
