// server/src/api/phd/student/active-qualifying-exam.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdExamEvents, phdStudentApplications } from "@/config/db/schema/phd.ts";
import { eq, and, gt, desc } from "drizzle-orm";
import assert from "assert";

const router = express.Router();

router.get("/", checkAccess(), asyncHandler(async (req, res) => {
  assert(req.user);
  const studentEmail = req.user.email;

  // Get active qualifying exam event
  const currentDate = new Date();
  const activeExam = await db.query.phdExamEvents.findFirst({
    where: and(
      eq(phdExamEvents.type, 'QualifyingExam'),
      gt(phdExamEvents.registrationDeadline, currentDate),
      eq(phdExamEvents.isActive, true)
    ),
    orderBy: [desc(phdExamEvents.registrationDeadline)],
  });

  if (!activeExam) {
     res.status(200).json({
      success: true,
      examEvent: null,
      canApply: false,
      message: "No active qualifying exam registration found",
      attemptsMade: 0,
      remainingAttempts: 0,
    });
    return;
  }

  // Check if student already applied for this event
  const existingApplication = await db.query.phdStudentApplications.findFirst({
    where: and(
      eq(phdStudentApplications.studentEmail, studentEmail),
      eq(phdStudentApplications.examEventId, activeExam.id)
    ),
  });

  // Get all student's qualifying exam applications
  const allApplications = await db.query.phdStudentApplications.findMany({
    where: eq(phdStudentApplications.studentEmail, studentEmail),
    with: {
      examEvent: true,
      results: true,
    },
    orderBy: [desc(phdStudentApplications.appliedAt)],
  });

  const qualifyingExamApplications = allApplications.filter(
    app => app.examEvent.type === 'QualifyingExam'
  );

  // Check if student has already passed
  const hasPassedQE = qualifyingExamApplications.some(app => 
    app.results.some(result => result.passed === true)
  );

  if (hasPassedQE) {
     res.status(200).json({
      success: true,
      examEvent: activeExam,
      canApply: false,
      message: "You have already passed the qualifying exam",
      attemptsMade: qualifyingExamApplications.length,
      remainingAttempts: 0,
    });
  }

  const attemptsMade = qualifyingExamApplications.length;
  const remainingAttempts = Math.max(0, 2 - attemptsMade);
  const canApply = !existingApplication && remainingAttempts > 0;

  res.status(200).json({
    success: true,
    examEvent: activeExam,
    canApply,
    message: canApply ? "You can apply for this exam." : "You are not eligible to apply.",
    attemptsMade,
    remainingAttempts,
  });
}));

export default router;
