import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdQualifyingExams, phdSemesters } from "@/config/db/schema/phd.ts";
import { sql, eq, desc, gte } from "drizzle-orm";

const router = express.Router();

router.get(
  "/",
  checkAccess(),
  asyncHandler(async (_req, res) => {
    // Get current date
    const currentDate = new Date();
    
    // Get the current active qualifying exam
    const activeExam = await db
      .select({
        id: phdQualifyingExams.id,
        examName: phdQualifyingExams.examName,
        deadline: phdQualifyingExams.deadline,
        semesterId: phdQualifyingExams.semesterId,
        semesterYear: phdSemesters.year,
        semesterNumber: phdSemesters.semesterNumber,
      })
      .from(phdQualifyingExams)
      .innerJoin(
        phdSemesters,
        eq(phdQualifyingExams.semesterId, phdSemesters.id)
      )
      .where(gte(phdQualifyingExams.deadline, currentDate))
      .orderBy(desc(phdQualifyingExams.deadline))
      .limit(1);

    if (!activeExam.length) {
      res.status(400).json({ success: false, message: "No active qualifying exam deadline found" });
      return;
    }

    const { deadline } = activeExam[0];
    
    // Look for students who have updated their qualifying areas in preparation for the exam
    // Using a time window of approximately 1-3 months before the deadline
    const threeMonthsBeforeDeadline = new Date(deadline);
    threeMonthsBeforeDeadline.setMonth(threeMonthsBeforeDeadline.getMonth() - 3);
    
    const students = await db
      .select({
        name: phd.name,
        email: phd.email,
        area1: phd.qualifyingArea1,
        area2: phd.qualifyingArea2,
        idNumber: phd.idNumber,
        examAttempt: phd.numberOfQeApplication,
      })
      .from(phd)
      .where(
        sql`${phd.qualifyingAreasUpdatedAt}>=${threeMonthsBeforeDeadline}
        AND ${phd.qualifyingAreasUpdatedAt}<=${deadline}`
      );

    res.status(200).json({ 
      success: true, 
      students,
      examInfo: activeExam[0]
    });
  })
);

export default router;