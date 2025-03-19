import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSemesters,  } from "@/config/db/schema/phd.ts";
import { eq, and } from "drizzle-orm";

const router = express.Router();

// Create or update a semester
export default router.post(
  "/",
  checkAccess("drc"),
  asyncHandler(async (req, res) => {
    const { year, semesterNumber, startDate, endDate } = req.body;
    
    // Check if semester already exists
    const existingSemester = await db
      .select()
      .from(phdSemesters)
      .where(
        and(
          eq(phdSemesters.year, year),
          eq(phdSemesters.semesterNumber, semesterNumber)
        )
      )
      .limit(1);
    
    if (existingSemester.length > 0) {
      // Update existing semester
      await db
        .update(phdSemesters)
        .set({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .where(eq(phdSemesters.id, existingSemester[0].id));
      
      res.status(200).json({ 
        success: true, 
        message: "Semester updated successfully",
        semester: {
          ...existingSemester[0],
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        }
      });
    } else {
      // Create new semester
      const newSemester = await db
        .insert(phdSemesters)
        .values({
          year,
          semesterNumber,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .returning();
      
      res.status(201).json({
        success: true,
        message: "Semester created successfully",
        semester: newSemester[0],
      });
    }
  })
);