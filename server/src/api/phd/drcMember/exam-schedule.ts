// server/src/api/phd/drc/exam-schedule.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdExamSchedule, phdStudentExamResults, phdSubAreas, phdStudentApplications } from "@/config/db/schema/phd.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq, and, inArray } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { z } from "zod";

const router = express.Router();

// POST /phd/drc/exam-events/:examEventId/schedule - Generate exam timetable
const generateScheduleSchema = z.object({
  finalExaminers: z.record(z.string(), z.record(z.string(), z.string().email())), // applicationId -> subAreaId -> examinerEmail
});

router.post("/:examEventId", checkAccess(), asyncHandler(async (req, res, next) => {
  const examEventId = parseInt(req.params.examEventId);
  const parsed = generateScheduleSchema.parse(req.body);

  // Get all applications for this event
  const applications = await db.query.phdStudentApplications.findMany({
    where: eq(phdStudentApplications.examEventId, examEventId),
    with: {
      student: true,
    },
  });

  if (applications.length === 0) {
    return next(new HttpError(HttpCode.NOT_FOUND, "No applications found for this exam event"));
  }

  // Get all sub-areas
  const subAreas = await db.select().from(phdSubAreas);
  const subAreaMap = new Map(subAreas.map(area => [area.subarea, area.id]));

  // Clear existing schedule for this event
  await db.delete(phdExamSchedule)
    .where(eq(phdExamSchedule.examEventId, examEventId));

  // ENHANCED TIMETABLE GENERATION ALGORITHM

  interface StudentExam {
    applicationId: number;
    studentEmail: string;
    subAreaId: number;
    subAreaName: string;
    examinerEmail: string;
  }

  interface SchedulingConstraint {
    studentEmail: string;
    exams: StudentExam[];
  }

  // Step 1: Build student exam constraints
  const studentConstraints: SchedulingConstraint[] = [];
  const examsByExaminer = new Map<string, StudentExam[]>();
  const conflicts: string[] = [];

  for (const application of applications) {
    const applicationExaminers = parsed.finalExaminers[application.id.toString()];
    if (!applicationExaminers) continue;

    const studentExams: StudentExam[] = [];

    // Process each qualifying area
    if (application.qualifyingArea1) {
      const subAreaId = subAreaMap.get(application.qualifyingArea1);
      const examinerEmail = subAreaId ? applicationExaminers[subAreaId.toString()] : null;
      
      if (subAreaId && examinerEmail) {
        const exam: StudentExam = {
          applicationId: application.id,
          studentEmail: application.studentEmail,
          subAreaId,
          subAreaName: application.qualifyingArea1,
          examinerEmail,
        };
        studentExams.push(exam);

        // Track exams by examiner
        if (!examsByExaminer.has(examinerEmail)) {
          examsByExaminer.set(examinerEmail, []);
        }
        examsByExaminer.get(examinerEmail)!.push(exam);
      }
    }

    if (application.qualifyingArea2) {
      const subAreaId = subAreaMap.get(application.qualifyingArea2);
      const examinerEmail = subAreaId ? applicationExaminers[subAreaId.toString()] : null;
      
      if (subAreaId && examinerEmail) {
        const exam: StudentExam = {
          applicationId: application.id,
          studentEmail: application.studentEmail,
          subAreaId,
          subAreaName: application.qualifyingArea2,
          examinerEmail,
        };
        studentExams.push(exam);

        // Track exams by examiner
        if (!examsByExaminer.has(examinerEmail)) {
          examsByExaminer.set(examinerEmail, []);
        }
        examsByExaminer.get(examinerEmail)!.push(exam);
      }
    }

    if (studentExams.length > 0) {
      studentConstraints.push({
        studentEmail: application.studentEmail,
        exams: studentExams,
      });
    }
  }

  // Step 2: Initialize sessions
  const sessions: StudentExam[][] = [[], []]; // Two sessions
  const studentSessionAssignments = new Map<string, Set<number>>();
  const examinerSessionAssignments = new Map<string, Set<number>>();

  // Step 3: Advanced scheduling algorithm
  for (const constraint of studentConstraints) {
    const { studentEmail, exams } = constraint;

    if (exams.length === 1) {
      // Student has only one exam - assign to any available session
      const exam = exams[0];
      
      // Try to minimize examiner conflicts
      let bestSession = 0;
      let minExaminerConflicts = Infinity;
      
      for (let sessionIndex = 0; sessionIndex < 2; sessionIndex++) {
        const examinerSessions = examinerSessionAssignments.get(exam.examinerEmail) || new Set();
        const conflicts = examinerSessions.has(sessionIndex) ? 1 : 0;
        
        if (conflicts < minExaminerConflicts) {
          minExaminerConflicts = conflicts;
          bestSession = sessionIndex;
        }
      }
      
      // Assign to best session
      sessions[bestSession].push(exam);
      
      // Update tracking
      if (!studentSessionAssignments.has(studentEmail)) {
        studentSessionAssignments.set(studentEmail, new Set());
      }
      studentSessionAssignments.get(studentEmail)!.add(bestSession);
      
      if (!examinerSessionAssignments.has(exam.examinerEmail)) {
        examinerSessionAssignments.set(exam.examinerEmail, new Set());
      }
      examinerSessionAssignments.get(exam.examinerEmail)!.add(bestSession);
      
    } else if (exams.length === 2) {
      // Student has two exams - must be in different sessions
      const [exam1, exam2] = exams;
      
      // Check if both exams have the same examiner (conflict case)
      if (exam1.examinerEmail === exam2.examinerEmail) {
        conflicts.push(studentEmail);
        // Still assign them to different sessions, but mark as conflict
        sessions[0].push(exam1);
        sessions[1].push(exam2);
      } else {
        // Different examiners - try to optimize examiner distribution
        let assignment: [number, number] = [0, 1]; // Default assignment
        
        // Check all possible assignments
        const possibleAssignments: [number, number][] = [[0, 1], [1, 0]];
        let bestAssignment = assignment;
        let minTotalConflicts = Infinity;
        
        for (const [session1, session2] of possibleAssignments) {
          const examiner1Sessions = examinerSessionAssignments.get(exam1.examinerEmail) || new Set();
          const examiner2Sessions = examinerSessionAssignments.get(exam2.examinerEmail) || new Set();
          
          const conflicts1 = examiner1Sessions.has(session1) ? 1 : 0;
          const conflicts2 = examiner2Sessions.has(session2) ? 1 : 0;
          const totalConflicts = conflicts1 + conflicts2;
          
          if (totalConflicts < minTotalConflicts) {
            minTotalConflicts = totalConflicts;
            bestAssignment = [session1, session2];
          }
        }
        
        // Apply best assignment
        const [session1, session2] = bestAssignment;
        sessions[session1].push(exam1);
        sessions[session2].push(exam2);
        
        // Update tracking
        if (!studentSessionAssignments.has(studentEmail)) {
          studentSessionAssignments.set(studentEmail, new Set());
        }
        studentSessionAssignments.get(studentEmail)!.add(session1);
        studentSessionAssignments.get(studentEmail)!.add(session2);
        
        // Update examiner tracking
        if (!examinerSessionAssignments.has(exam1.examinerEmail)) {
          examinerSessionAssignments.set(exam1.examinerEmail, new Set());
        }
        examinerSessionAssignments.get(exam1.examinerEmail)!.add(session1);
        
        if (!examinerSessionAssignments.has(exam2.examinerEmail)) {
          examinerSessionAssignments.set(exam2.examinerEmail, new Set());
        }
        examinerSessionAssignments.get(exam2.examinerEmail)!.add(session2);
      }
    }
  }

  // Step 4: Insert schedule records into database
  const scheduleRecords = [];
  for (let sessionIndex = 0; sessionIndex < sessions.length; sessionIndex++) {
    for (const exam of sessions[sessionIndex]) {
      scheduleRecords.push({
        examEventId,
        applicationId: exam.applicationId,
        subAreaId: exam.subAreaId,
        examinerEmail: exam.examinerEmail,
        sessionNumber: sessionIndex + 1,
      });
    }
  }

  if (scheduleRecords.length > 0) {
    await db.insert(phdExamSchedule).values(scheduleRecords);
  }

  // Step 5: Generate response format
  const formattedSessions = sessions.map((session, index) => ({
    sessionNumber: index + 1,
    exams: session.map(exam => ({
      studentEmail: exam.studentEmail,
      applicationId: exam.applicationId,
      subAreaId: exam.subAreaId,
      subAreaName: exam.subAreaName,
      examinerEmail: exam.examinerEmail,
    })),
  }));

  res.status(201).json({
    success: true,
    message: "Timetable generated and saved with conflict optimization.",
    schedule: {
      session1: formattedSessions[0].exams,
      session2: formattedSessions[1].exams,
    },
    conflicts: conflicts.length > 0 ? conflicts : undefined,
    statistics: {
      totalExams: scheduleRecords.length,
      studentsWithConflicts: conflicts.length,
      examinerDistribution: {
        session1: [...new Set(sessions[0].map(e => e.examinerEmail))].length,
        session2: [...new Set(sessions[1].map(e => e.examinerEmail))].length,
      }
    }
  });
}));

// GET /phd/drc/exam-events/:examEventId/schedule - View exam timetable
router.get("/:examEventId", checkAccess(), asyncHandler(async (req, res) => {
  const examEventId = parseInt(req.params.examEventId);

  const schedules = await db.query.phdExamSchedule.findMany({
    where: eq(phdExamSchedule.examEventId, examEventId),
    with: {
      application: {
        with: {
          student: true,
        },
      },
      subArea: true,
      examiner: {
        with: {
          faculty: true,
        },
      },
    },
  });

  const session1 = schedules.filter(schedule => schedule.sessionNumber === 1);
  const session2 = schedules.filter(schedule => schedule.sessionNumber === 2);

  res.status(200).json({
    success: true,
    schedule: {
      session1: session1.map(schedule => ({
        studentName: schedule.application.student?.name || "Unknown",
        studentEmail: schedule.application.studentEmail,
        subArea: schedule.subArea.subarea,
        examinerName: schedule.examiner?.faculty?.name || "Unknown",
        examinerEmail: schedule.examinerEmail,
      })),
      session2: session2.map(schedule => ({
        studentName: schedule.application.student?.name || "Unknown",
        studentEmail: schedule.application.studentEmail,
        subArea: schedule.subArea.subarea,
        examinerName: schedule.examiner?.faculty?.name || "Unknown",
        examinerEmail: schedule.examinerEmail,
      })),
    },
  });
}));

// POST /phd/drc/applications/results - Update final exam results
const updateResultsSchema = z.object({
  results: z.array(z.object({
    applicationId: z.number(),
    subAreaId: z.number(),
    passed: z.boolean(),
    comments: z.string().optional(),
  })),
});

router.post("/applications/results", checkAccess(), asyncHandler(async (req, res) => {
  const parsed = updateResultsSchema.parse(req.body);

  await db.transaction(async (tx) => {
    // Insert the exam results
    const resultRecords = parsed.results.map(result => ({
      applicationId: result.applicationId,
      subAreaId: result.subAreaId,
      passed: result.passed,
      comments: result.comments || null,
      evaluatedBy: req.user!.email,
      evaluatedAt: new Date(),
    }));

    await tx.insert(phdStudentExamResults).values(resultRecords);

    // POST-RESULT PROCESSING LOGIC
    
    // Step 1: Get unique student emails from the submitted results
    const applicationIds = [...new Set(parsed.results.map(r => r.applicationId))];
    
    const affectedApplications = await tx.query.phdStudentApplications.findMany({
      where: inArray(phdStudentApplications.id, applicationIds),
      columns: { studentEmail: true, id: true },
    });

    const uniqueStudentEmails = [...new Set(affectedApplications.map(app => app.studentEmail))];

    // Step 2: Process each student's overall QE status
    for (const studentEmail of uniqueStudentEmails) {
      // Get all QE applications for this student
      const allStudentApplications = await tx.query.phdStudentApplications.findMany({
        where: eq(phdStudentApplications.studentEmail, studentEmail),
        with: {
          examEvent: true,
          results: true,
        },
      });

      // Filter for qualifying exam applications only
      const qeApplications = allStudentApplications.filter(
        app => app.examEvent.type === 'QualifyingExam'
      );

      if (qeApplications.length === 0) continue;

      // Check if student has passed any sub-area in any attempt
      const hasPassedAnySubArea = qeApplications.some(app =>
        app.results.some(result => result.passed === true)
      );

      // Get current student record
      const currentStudent = await tx.query.phd.findFirst({
        where: eq(phd.email, studentEmail),
      });

      if (!currentStudent) continue;

      if (hasPassedAnySubArea) {
        // Student has passed - set qualification date if not already set
        if (!currentStudent.qualificationDate) {
          await tx.update(phd)
            .set({
              qualificationDate: new Date(),
            })
            .where(eq(phd.email, studentEmail));
        }
      } else {
        // Student hasn't passed yet - check if they've exhausted all attempts
        const totalAttempts = qeApplications.length;
        
        // Check if all applications have been evaluated (have results)
        const allApplicationsEvaluated = qeApplications.every(app => {
          // An application is considered evaluated if it has results for both sub-areas
          // or if it has any results and those results are complete
          return app.results.length > 0;
        });

        // If student has made 2 attempts and all are evaluated with no passes
        if (totalAttempts >= 2 && allApplicationsEvaluated) {
          const hasAnyPass = qeApplications.some(app =>
            app.results.some(result => result.passed === true)
          );

          if (!hasAnyPass) {
            // Student has failed all attempts - deactivate
            await tx.update(phd)
              .set({
                isDeactivated: true,
              })
              .where(eq(phd.email, studentEmail));
          }
        }
      }
    }
  });

  res.status(200).json({
    success: true,
    message: `${parsed.results.length} exam results have been successfully updated and student statuses processed.`,
  });
}));

export default router;
