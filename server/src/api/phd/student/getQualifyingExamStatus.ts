// server/src/api/phd/student/getQualifyingExamStatus.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdStudentApplications } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import assert from "assert";

const router = express.Router();

export default router.get("/", checkAccess(), asyncHandler(async (req, res) => {
  assert(req.user);
  const userEmail = req.user.email;

  // Get all qualifying exam applications and results for this student
  const applications = await db.query.phdStudentApplications.findMany({
    where: eq(phdStudentApplications.studentEmail, userEmail),
    with: {
      examEvent: true,
      results: true,
    },
  });

  const qeApplications = applications.filter(app => app.examEvent.type === 'QualifyingExam');

  if (qeApplications.length === 0) {
    res.json({
      success: true,
      status: 'pending' // No attempts made yet
    });
  }
  
  // Check if student has passed any sub-area in any attempt
  const hasPassed = qeApplications.some(app => 
    app.results.some(result => result.passed === true)
  );
  
  if (hasPassed) {
    res.json({
      success: true,
      status: 'pass'
    });
  }

  const totalAttempts = qeApplications.length;
  
  // Check if all attempts have been fully evaluated
  const allApplicationsEvaluated = qeApplications.every(app => {
    // An application is fully evaluated if it has at least one result
    // (in practice, should have 2 results - one for each sub-area)
    return app.results.length > 0;
  });

  // If student has made maximum attempts (2) and all are evaluated with no passes
  if (totalAttempts >= 2 && allApplicationsEvaluated) {
    const hasAnyPass = qeApplications.some(app => 
      app.results.some(result => result.passed === true)
    );
    
    if (!hasAnyPass) {
      res.json({
        success: true,
        status: 'fail' // Failed both attempts
      });
    }
  }
  
  // Otherwise, results are still pending or student can attempt again
  res.json({
    success: true,
    status: 'pending'
  });
}));
