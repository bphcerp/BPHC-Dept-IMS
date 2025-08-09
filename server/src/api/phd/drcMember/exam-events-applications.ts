// server/src/api/phd/drc/exam-events-applications.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdStudentApplications } from "@/config/db/schema/phd.ts";
import { eq, desc } from "drizzle-orm";
import environment from "@/config/environment.ts";
import JSZip from "jszip";
import fs from "fs";
import { HttpError, HttpCode } from "@/config/errors.ts";

const router = express.Router();

// GET /phd/drc/exam-events/:examEventId/applications - List applications for event
router.get("/:examEventId", checkAccess(), asyncHandler(async (req, res) => {
  const examEventId = parseInt(req.params.examEventId);

  const applications = await db.query.phdStudentApplications.findMany({
    where: eq(phdStudentApplications.examEventId, examEventId),
    with: {
      student: true,
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
    studentName: app.student?.name || "Unknown",
    studentEmail: app.studentEmail,
    attemptNumber: app.attemptNumber,
    status: app.status,
    appliedAt: app.appliedAt,
    qualifyingArea1: app.qualifyingArea1,
    qualifyingArea2: app.qualifyingArea2,
    applicationFormUrl: app.applicationFormFileId 
      ? `${environment.SERVER_URL}/f/${app.applicationFormFileId}`
      : null,
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

// GET /phd/drc/exam-events/:examEventId/applications/zip - Download applications as ZIP
router.get("/zip/:examEventId", checkAccess(), asyncHandler(async (req, res, next) => {
  const examEventId = parseInt(req.params.examEventId);

  const applications = await db.query.phdStudentApplications.findMany({
    where: eq(phdStudentApplications.examEventId, examEventId),
    with: {
      student: true,
      examEvent: true,
    },
  });

  if (applications.length === 0) {
    return next(new HttpError(HttpCode.NOT_FOUND, "No applications found for this exam event"));
  }

  const zip = new JSZip();
  const examEvent = applications[0].examEvent;
  const folderName = `${examEvent.name.replace(/\s+/g, "_")}_${examEvent.registrationDeadline.toISOString().split("T")[0]}`;
  const folder = zip.folder(folderName);

  if (!folder) {
    return next(new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Failed to create zip folder"));
  }

  const failedFiles: Array<{name: string; reason: string}> = [];

  for (const application of applications) {
    try {
      if (application.applicationFormFileId) {
        const fileRecord = await db.query.files.findFirst({
          where: (files, { eq }) => eq(files.id, application.applicationFormFileId!),
        });

        if (fileRecord && fs.existsSync(fileRecord.filePath)) {
          const fileData = fs.readFileSync(fileRecord.filePath);
          const sanitizedEmail = application.studentEmail.replace(/[^a-z0-9]/gi, "_");
          const fileName = `${sanitizedEmail}_${application.attemptNumber}_${fileRecord.originalName}`;
          folder.file(fileName, fileData);
        } else {
          failedFiles.push({
            name: application.student?.name || application.studentEmail,
            reason: "File not found on disk",
          });
        }
      } else {
        failedFiles.push({
          name: application.student?.name || application.studentEmail,
          reason: "No application form uploaded",
        });
      }
    } catch (error) {
      console.error(`Error processing application ${application.id}:`, error);
      failedFiles.push({
        name: application.student?.name || application.studentEmail,
        reason: "Processing error",
      });
    }
  }

  if (failedFiles.length > 0) {
    let summaryContent = "The following files could not be included in the ZIP:\n\n";
    failedFiles.forEach((file) => {
      summaryContent += `${file.name}: ${file.reason}\n`;
    });
    folder.file("_SUMMARY_MISSING_FILES.txt", summaryContent);
  }

  const zipContent = await zip.generateAsync({ type: "nodebuffer" });

  res.setHeader("Content-Disposition", `attachment; filename="${folderName}.zip"`);
  res.setHeader("Content-Type", "application/zip");
  res.send(zipContent);
}));

export default router;
