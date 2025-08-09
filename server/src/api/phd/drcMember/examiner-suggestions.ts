// server/src/api/phd/drc/examiner-suggestions.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdStudentApplications, phdExaminerSuggestions } from "@/config/db/schema/phd.ts";
import { eq, and } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { createTodos, createNotifications } from "@/lib/todos/index.ts";
import { modules } from "lib";
 

const router = express.Router();

// POST /phd/drc/exam-events/:examEventId/request-suggestions - Initiate examiner suggestion process
router.post("/:examEventId/request-suggestions", checkAccess(), asyncHandler(async (req, res, next) => {
  const examEventId = parseInt(req.params.examEventId);

  // Get all applications for this exam event
  const applications = await db.query.phdStudentApplications.findMany({
    where: and(
      eq(phdStudentApplications.examEventId, examEventId),
      eq(phdStudentApplications.status, 'Applied')
    ),
    with: {
      student: true,
      examEvent: true,
    },
  });

  if (applications.length === 0) {
    return next(new HttpError(HttpCode.NOT_FOUND, "No applications found for this exam event"));
  }

  const supervisorEmails = new Set<string>();
  const suggestionRecords: { applicationId: number; supervisorEmail: string; }[] = [];

    for (const application of applications) {
        if (application.student?.supervisorEmail) {
            supervisorEmails.add(application.student.supervisorEmail);
            suggestionRecords.push({
                applicationId: application.id,
                supervisorEmail: application.student.supervisorEmail,
            });
        }
    }

  await db.transaction(async (tx) => {
    // Insert examiner suggestion records
    if (suggestionRecords.length > 0) {
      await tx.insert(phdExaminerSuggestions).values(suggestionRecords);
    }

    // Create todos for supervisors
    const todos = Array.from(supervisorEmails).map(supervisorEmail => ({
      module: modules[4], // PhD QE Application
      title: "Submit Examiner Suggestions",
      description: `Please submit examiner suggestions for your PhD students' qualifying exam (${applications[0].examEvent.name})`,
      assignedTo: supervisorEmail,
      createdBy: req.user!.email,
      completionEvent: `examiner_suggestions_${examEventId}_${supervisorEmail}`,
      link: "/phd/supervisor/pending-suggestions",
    }));

    await createTodos(todos, tx);

    // Create notifications
    const notifications = Array.from(supervisorEmails).map(supervisorEmail => ({
      module: modules[4],
      title: "Examiner Suggestions Required",
      content: `Please submit examiner suggestions for your PhD students' qualifying exam by the deadline.`,
      userEmail: supervisorEmail,
      link: "/phd/supervisor/pending-suggestions",
    }));

    await createNotifications(notifications, false, tx);
  });

  res.status(200).json({
    success: true,
    message: `Examiner suggestion requests initiated for ${applications.length} applications and sent to ${supervisorEmails.size} unique supervisors.`,
  });
}));

// GET /phd/drc/exam-events/:examEventId/suggestion-status - Monitor examiner suggestion status
router.get("/:examEventId/suggestion-status", checkAccess(), asyncHandler(async (req, res) => {
    const examEventId = parseInt(req.params.examEventId);

    const applicationsForEvent = await db.query.phdStudentApplications.findMany({
        where: eq(phdStudentApplications.examEventId, examEventId),
        with: {
            student: { with: { supervisor: { with: { faculty: true } } } },
            examinerSuggestions: true
        }
    });

    const formattedSuggestions = applicationsForEvent.map(app => {
        const suggestion = app.examinerSuggestions[0];
        return {
            suggestionRequestId: suggestion?.id || null,
            studentName: app.student?.name || "Unknown",
            supervisorName: app.student?.supervisor?.faculty?.name || "Unknown",
            supervisorEmail: app.student?.supervisorEmail || "N/A",
            status: suggestion?.status || "Not Initiated",
            submittedAt: suggestion?.submittedAt || null,
        };
    });

    res.status(200).json({ success: true, suggestionStatuses: formattedSuggestions });
}));

// GET /phd/drc/exam-events/:examEventId/suggestions - View all submitted suggestions for event
router.get("/:examEventId", checkAccess(), asyncHandler(async (req, res) => {
  const examEventId = parseInt(req.params.examEventId);

  const applicationsWithSuggestions = await db.query.phdStudentApplications.findMany({
        where: eq(phdStudentApplications.examEventId, examEventId),
        with: {
            student: { columns: { name: true } },
            examinerSuggestions: {
                where: eq(phdExaminerSuggestions.status, 'Submitted')
            }
        }
    });
    
    const formattedSuggestions = applicationsWithSuggestions
        .filter(app => app.examinerSuggestions.length > 0) // Only include apps with submitted suggestions
        .map(app => {
            const suggestion = app.examinerSuggestions[0];
            return {
                applicationId: app.id,
                studentName: app.student?.name || "Unknown",
                qualifyingArea1: app.qualifyingArea1,
                suggestedExaminers1: suggestion.subArea1Examiners,
                qualifyingArea2: app.qualifyingArea2,
                suggestedExaminers2: suggestion.subArea2Examiners,
            };
        });

    res.status(200).json({ success: true, submittedSuggestions: formattedSuggestions });
}));

// POST /phd/drc/suggestion-requests/:suggestionRequestId/remind - Send reminder to supervisor
router.post("/suggestion-requests/:suggestionRequestId/remind", checkAccess(), asyncHandler(async (req, res, next) => {
  const suggestionRequestId = parseInt(req.params.suggestionRequestId);

  const suggestion = await db.query.phdExaminerSuggestions.findFirst({
    where: eq(phdExaminerSuggestions.id, suggestionRequestId),
    with: {
      application: {
        with: {
          student: true,
          examEvent: true,
        },
      },
    },
  });

  if (!suggestion) {
    return next(new HttpError(HttpCode.NOT_FOUND, "Suggestion request not found"));
  }

  if (suggestion.status === 'Submitted') {
    return next(new HttpError(HttpCode.BAD_REQUEST, "Suggestion already submitted"));
  }

  // Update reminder count
  await db.update(phdExaminerSuggestions)
    .set({
      reminderCount: (suggestion.reminderCount || 0) + 1,
      lastReminderAt: new Date(),
    })
    .where(eq(phdExaminerSuggestions.id, suggestionRequestId));

  // Send notification
  await createNotifications([{
    module: modules[4],
    title: "Reminder: Examiner Suggestions Required",
    content: `This is a reminder to submit examiner suggestions for ${suggestion.application.student?.name}'s qualifying exam.`,
    userEmail: suggestion.supervisorEmail,
    link: "/phd/supervisor/pending-suggestions",
  }]);

  res.status(200).json({
    success: true,
    message: `Reminder sent to ${suggestion.supervisorEmail}.`,
  });
}));

export default router;
