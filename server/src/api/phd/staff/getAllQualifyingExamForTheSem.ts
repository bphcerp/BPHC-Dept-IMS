import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSemesters, phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

export default router.get(
  "/:semesterId",
  checkAccess(),
  asyncHandler(async (req, res) => {
    const { semesterId } = req.params;
    const exams = await db
      .select({
        id: phdQualifyingExams.id,
        examName: phdQualifyingExams.examName,
        deadline: phdQualifyingExams.deadline,
        examStartDate: phdQualifyingExams.examStartDate,
        examEndDate: phdQualifyingExams.examEndDate,
        vivaDate: phdQualifyingExams.vivaDate,
        createdAt: phdQualifyingExams.createdAt,
        semesterId: phdQualifyingExams.semesterId,
        semesterYear: phdSemesters.year,
        semesterNumber: phdSemesters.semesterNumber,
      })
      .from(phdQualifyingExams)
      .innerJoin(
        phdSemesters,
        eq(phdQualifyingExams.semesterId, phdSemesters.id)
      )
      .where(eq(phdQualifyingExams.semesterId, parseInt(semesterId)));
    
    res.status(200).json({ success: true, exams });
  })
);