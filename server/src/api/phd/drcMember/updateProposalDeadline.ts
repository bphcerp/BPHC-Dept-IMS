import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdSemesters, phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { eq, and } from "drizzle-orm";

const router = express.Router();

export default router.post(
  "/",
  checkAccess(),
  asyncHandler(async (req, res) => {
    const { semesterId, deadline } = req.body;
    
    // Verify semester exists
    const semester = await db
      .select()
      .from(phdSemesters)
      .where(eq(phdSemesters.id, semesterId))
      .limit(1);
      
    if (semester.length === 0) {
      throw new HttpError(HttpCode.NOT_FOUND, "Semester not found");
    }
    
    // Define the proposal exam name
    const examName = "Thesis Proposal";
    
    // Check if there's an existing proposal deadline for this semester
    const existingProposal = await db
      .select()
      .from(phdQualifyingExams)
      .where(
        and(
          eq(phdQualifyingExams.semesterId, semesterId),
          eq(phdQualifyingExams.examName, examName)
        )
      )
      .limit(1);
      
    if (existingProposal.length > 0) {
      // Update existing proposal deadline
      await db
        .update(phdQualifyingExams)
        .set({
          deadline: new Date(deadline),
        })
        .where(eq(phdQualifyingExams.id, existingProposal[0].id));
        
      res.status(200).json({
        success: true,
        message: "Proposal deadline updated successfully",
        proposal: {
          ...existingProposal[0],
          deadline: new Date(deadline),
        }
      });
    } else {
      // Create new proposal deadline
      const newProposal = await db
        .insert(phdQualifyingExams)
        .values({
          semesterId,
          examName,
          deadline: new Date(deadline),
        })
        .returning();
        
      res.status(201).json({
        success: true,
        message: "Proposal deadline created successfully",
        proposal: newProposal[0],
      });
    }
  })
);