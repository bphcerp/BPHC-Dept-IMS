// server/src/api/phd/staff/semesters.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSemesters } from "@/config/db/schema/phd.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const router = express.Router();

// GET /phd/staff/semesters - List all semesters
router.get("/", checkAccess(), asyncHandler(async (req, res) => {
  const semesters = await db.select()
    .from(phdSemesters)
    .orderBy(desc(phdSemesters.academicYear), desc(phdSemesters.semesterNumber));

  res.status(200).json({
    success: true,
    semesters,
  });
}));

// POST /phd/staff/semesters - Create/Update semester
const semesterSchema = z.object({
    academicYear: z.string(),
    semesterNumber: z.number().int().min(1).max(2),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

router.post("/", checkAccess(), asyncHandler(async (req, res, next) => {
  const parsed = semesterSchema.parse(req.body);
  
  const startDate = new Date(parsed.startDate);
  const endDate = new Date(parsed.endDate);
  
  if (startDate >= endDate) {
    return next(new HttpError(HttpCode.BAD_REQUEST, "Start date must be before end date"));
  }

  // Check if semester already exists
  const existing = await db.query.phdSemesters.findFirst({
    where: (semesters, { and, eq }) => and(
      eq(semesters.academicYear, parsed.academicYear),
      eq(semesters.semesterNumber, parsed.semesterNumber)
    ),
  });

  let semester;
  if (existing) {
    // Update existing semester
    const updated = await db.update(phdSemesters)
      .set({
        startDate,
        endDate,
        updatedAt: new Date(),
      })
      .where(eq(phdSemesters.id, existing.id))
      .returning();
    semester = updated[0];
  } else {
    // Create new semester
    const created = await db.insert(phdSemesters)
      .values({
        academicYear: parsed.academicYear,
        semesterNumber: parsed.semesterNumber,
        startDate,
        endDate,
      })
      .returning();
    semester = created[0];
  }

  res.status(existing ? 200 : 201).json({
    success: true,
    semester,
    message: existing ? "Semester updated successfully" : "Semester created successfully",
  });
}));

export default router;
