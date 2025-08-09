// server/src/api/phd/drcMember/getSupervisorsForEvent.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdStudentApplications } from "@/config/db/schema/phd.ts";
import { faculty } from "@/config/db/schema/admin.ts";
import { eq, inArray } from "drizzle-orm";

const router = express.Router();

// GET /phd/drcMember/exam-events/:examEventId/supervisors
router.get("/:examEventId", checkAccess(), asyncHandler(async (req, res) => {
  const examEventId = parseInt(req.params.examEventId);

  // Get all applications for the event with student details
  const applications = await db.query.phdStudentApplications.findMany({
    where: eq(phdStudentApplications.examEventId, examEventId),
    with: {
      student: true,
      examEvent: true,
    },
  });

  if (applications.length === 0) {
    res.status(200).json({
      success: true,
      supervisors: [],
    });
  }

  // Get unique supervisor emails
  const supervisorEmails = [...new Set(
    applications
      .map(app => app.student?.supervisorEmail)
      .filter(email => email !== null && email !== undefined)
  )] as string[];

  if (supervisorEmails.length === 0) {
    res.status(200).json({
      success: true,
      supervisors: [],
    });
  }

  // Get supervisor details
  const supervisors = await db.select({
    email: faculty.email,
    name: faculty.name,
  }).from(faculty)
    .where(inArray(faculty.email, supervisorEmails));

  // Group students by supervisor
  const supervisorsWithStudents = supervisors.map(supervisor => {
    const supervisorStudents = applications.filter(
      app => app.student?.supervisorEmail === supervisor.email
    );

    return {
      email: supervisor.email,
      name: supervisor.name,
      students: supervisorStudents.map(app => ({
        email: app.studentEmail,
        name: app.student?.name || "Unknown",
        applicationId: app.id,
        qualifyingArea1: app.qualifyingArea1,
        qualifyingArea2: app.qualifyingArea2,
        attemptNumber: app.attemptNumber,
      })),
    };
  });

  res.status(200).json({
    success: true,
    supervisors: supervisorsWithStudents,
  });
}));

export default router;
