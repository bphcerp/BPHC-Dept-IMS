import db from "@/config/db/index.ts";
import { semester } from "@/config/db/schema/allocation.ts"; 
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";

const router = express.Router();

const updateSemesterSchema = z.object({
  id: z.string().uuid(),
  year: z.number().int(),
  oddEven: z.enum(["odd", "even"]),
  startDate: z.date(),
  endDate: z.date(),
  allocationDeadline: z.date(),
  noOfElectivesPerInstructor: z.number().int(),
  noOfDisciplineCoursesPerInstructor: z.number().int(),
  allocationSchema: z.enum(["notStarted", "ongoing", "completed", "suspended"]),
});

router.put(
  "/update",
  checkAccess("allocation:semester:update"),
  asyncHandler(async (req, res, next) => {
    const parsed = updateSemesterSchema.parse(req.body);

    const existingSemester = await db.query.semester.findFirst({
      where: (c, { eq }) => eq(c.id, parsed.id),
    });

    if (!existingSemester) {
      return next(
        new HttpError(HttpCode.NOT_FOUND, "Semester not found for given id")
      );
    }

    const { id, ...updates } = parsed;

    if (Object.keys(updates).length === 0) {
      return next(
        new HttpError(HttpCode.BAD_REQUEST, "No fields provided to update")
      );
    }

    const updated = await db
      .update(semester)
      .set({
        ...updates,
        updatedAt: new Date(),
        
      })
      .where(eq(semester.id, id))
      .returning();

    res.status(200).json({ success: true, data: updated[0] });
  })
);

export default router;
