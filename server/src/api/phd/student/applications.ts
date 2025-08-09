// server/src/api/phd/student/applications.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdStudentApplications, phdExamEvents } from "@/config/db/schema/phd.ts";
import { files } from "@/config/db/schema/form.ts";
import { eq, and, desc } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { pdfUpload } from "@/config/multer.ts";
import multer from "multer";
import { modules } from "lib";
import assert from "assert";
import { z } from "zod";
import environment from "@/config/environment.ts";

const router = express.Router();

// GET /phd/student/applications - View application history
router.get("/", checkAccess(), asyncHandler(async (req, res) => {
  assert(req.user);
  const studentEmail = req.user.email;

  const applications = await db.query.phdStudentApplications.findMany({
    where: eq(phdStudentApplications.studentEmail, studentEmail),
    with: {
      examEvent: true,
      results: {
        with: {
          subArea: true,
        },
      },
    },
    orderBy: [desc(phdStudentApplications.appliedAt)],
  });

  const formattedApplications = applications.map(app => ({
    applicationId: app.id,
    examEventName: app.examEvent.name,
    attemptNumber: app.attemptNumber,
    status: app.status,
    appliedAt: app.appliedAt,
    results: app.results.map(result => ({
      subArea: result.subArea.subarea,
      passed: result.passed,
      comments: result.comments,
      evaluatedBy: result.evaluatedBy,
      evaluatedAt: result.evaluatedAt,
    })),
  }));

  res.status(200).json({
    success: true,
    applications: formattedApplications,
  });
}));

// POST /phd/student/applications - Apply for qualifying exam
const applyQESchema = z.object({
  examEventId: z.string().transform(Number),
  qualifyingArea1: z.string().min(1),
  qualifyingArea2: z.string().min(1),
});

router.post("/", 
  checkAccess(),
  asyncHandler(async (req, res, next) => 
    pdfUpload.single("applicationForm")(req, res, (err) => {
      if (err instanceof multer.MulterError) 
        return next(new HttpError(HttpCode.BAD_REQUEST, err.message));
      next(err);
    })
  ),
  asyncHandler(async (req, res, next) => {
    assert(req.user);
    const studentEmail = req.user.email;
    
    if (!req.file) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "Application form file is required"));
    }

    const parsed = applyQESchema.parse(req.body);

    // Validate exam event exists and is active
    const examEvent = await db.query.phdExamEvents.findFirst({
      where: and(
        eq(phdExamEvents.id, parsed.examEventId),
        eq(phdExamEvents.type, 'QualifyingExam'),
        eq(phdExamEvents.isActive, true)
      ),
    });

    if (!examEvent) {
      return next(new HttpError(HttpCode.NOT_FOUND, "Invalid or inactive exam event"));
    }

    // Check if registration deadline has passed
    if (new Date() > examEvent.registrationDeadline) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "Registration deadline has passed"));
    }

    // Check if student has already applied for this event
    const existingApplication = await db.query.phdStudentApplications.findFirst({
      where: and(
        eq(phdStudentApplications.studentEmail, studentEmail),
        eq(phdStudentApplications.examEventId, parsed.examEventId)
      ),
    });

    if (existingApplication) {
      return next(new HttpError(HttpCode.CONFLICT, "You have already applied for this exam"));
    }

    // Get student's total qualifying exam attempts
    const allQEApplications = await db.query.phdStudentApplications.findMany({
      where: eq(phdStudentApplications.studentEmail, studentEmail),
      with: { 
        examEvent: true, 
        results: true 
      },
    });

    const qeApplications = allQEApplications.filter(app => app.examEvent.type === 'QualifyingExam');
    
    // Check if student has already passed
    const hasPassedQE = qeApplications.some(app => 
      app.results.some(result => result.passed === true)
    );

    if (hasPassedQE) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "You have already passed the qualifying exam"));
    }

    // Check attempt limit
    if (qeApplications.length >= 2) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "Maximum qualifying exam attempts reached"));
    }

    const attemptNumber = qeApplications.length + 1;

    const application = await db.transaction(async (tx) => {
      // Insert file record
      const [fileRecord] = await tx.insert(files).values({
        userEmail: studentEmail,
        filePath: req.file!.path,
        originalName: req.file!.originalname,
        mimetype: req.file!.mimetype,
        size: req.file!.size,
        fieldName: "applicationForm",
        module: modules[4], // PhD QE Application module
      }).returning();

      // Create application record
      const [applicationRecord] = await tx.insert(phdStudentApplications).values({
        studentEmail,
        examEventId: parsed.examEventId,
        attemptNumber,
        applicationFormFileId: fileRecord.id,
        qualifyingArea1: parsed.qualifyingArea1,
        qualifyingArea2: parsed.qualifyingArea2,
      }).returning();

      return applicationRecord;
    });

    res.status(201).json({
      success: true,
      message: `Application submitted successfully (Attempt ${attemptNumber}/2)`,
      application,
    });
  })
);

// PUT /phd/student/applications/:applicationId - Update/Withdraw application
const updateApplicationSchema = z.object({
  qualifyingArea1: z.string().min(1).optional(),
  qualifyingArea2: z.string().min(1).optional(),
  status: z.enum(['Withdrawn']).optional(),
});

router.put("/:applicationId", checkAccess(), asyncHandler(async (req, res, next) => {
  assert(req.user);
  const studentEmail = req.user.email;
  const applicationId = parseInt(req.params.applicationId);
  
  const parsed = updateApplicationSchema.parse(req.body);

  // Get the application
  const application = await db.query.phdStudentApplications.findFirst({
    where: and(
      eq(phdStudentApplications.id, applicationId),
      eq(phdStudentApplications.studentEmail, studentEmail)
    ),
    with: {
      examEvent: true,
    },
  });

  if (!application) {
    return next(new HttpError(HttpCode.NOT_FOUND, "Application not found"));
  }

  // Check if registration deadline has passed
  if (new Date() > application.examEvent.registrationDeadline) {
    return next(new HttpError(HttpCode.BAD_REQUEST, "Cannot update application after registration deadline"));
  }

  // Check if application can be updated
  if (application.status !== 'Applied') {
    return next(new HttpError(HttpCode.BAD_REQUEST, "Can only update applications with 'Applied' status"));
  }

  const updateData: Partial<typeof phdStudentApplications.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (parsed.qualifyingArea1) updateData.qualifyingArea1 = parsed.qualifyingArea1;
  if (parsed.qualifyingArea2) updateData.qualifyingArea2 = parsed.qualifyingArea2;
  if (parsed.status) updateData.status = parsed.status;

  const [updatedApplication] = await db.update(phdStudentApplications)
    .set(updateData)
    .where(eq(phdStudentApplications.id, applicationId))
    .returning();

  res.status(200).json({
    success: true,
    message: "Your application has been updated.",
    application: updatedApplication,
  });
}));

export default router;
