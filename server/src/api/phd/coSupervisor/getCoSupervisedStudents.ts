import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { applications, applicationStatus, fileFields, files } from "@/config/db/schema/form.ts";
import { eq, or, desc, sql, and } from "drizzle-orm";
import assert from "assert";
import environment from "@/config/environment.ts";
import { modules } from "lib";

const router = express.Router();

router.get(
  "/",
  checkAccess(),
  asyncHandler(async (req, res) => {
    assert(req.user);
    const coSupervisorEmail = req.user.email;

    // Get all co-supervised students
    const students = await db
      .select({
        email: phd.email,
        name: phd.name,
        qualifyingArea1: phd.qualifyingArea1,
        qualifyingArea2: phd.qualifyingArea2,
      })
      .from(phd)
      .where(
        or(eq(phd.coSupervisorEmail, coSupervisorEmail), eq(phd.coSupervisorEmail2, coSupervisorEmail))
      );

    // Fetch student documents with their application status
    const studentsWithDocuments = await Promise.all(
      students.map(async (student) => {
        // Find the latest application for the PhD module
        const latestApplication = await db
          .select({ 
            id: applications.id,
            status: applications.status
          })
          .from(applications)
          .where(
            and(
              eq(applications.userEmail, student.email),
              eq(applications.module, modules[3]) // PhD module
            )
          )
          .orderBy(desc(applications.id))
          .limit(1);

        // Fetch the latest application status details
        let applicationStatusDetails = null;
        if (latestApplication.length > 0) {
          const statusResult = await db
            .select({
              comments: applicationStatus.comments,
              updatedAs: applicationStatus.updatedAs,
            })
            .from(applicationStatus)
            .where(eq(applicationStatus.applicationId, latestApplication[0].id))
            .orderBy(desc(applicationStatus.id))
            .limit(1);

          if (statusResult.length > 0) {
            applicationStatusDetails = statusResult[0];
          }
        }

        // Fetch documents submitted by this student
        const documents = await db
          .select({
            id: fileFields.id,
            fieldName: fileFields.fieldName,
            fileName: files.originalName,
            fileUrl: sql`CONCAT(${environment.SERVER_URL}::text, '/f/', ${files.id})`.as("fileUrl"),
            uploadedAt: files.createdAt,
          })
          .from(fileFields)
          .innerJoin(files, eq(fileFields.fileId, files.id))
          .where(eq(fileFields.userEmail, student.email))
          .orderBy(desc(files.createdAt));

        return {
          ...student,
          applicationStatus: latestApplication.length > 0 
            ? {
                status: latestApplication[0].status,
                comments: applicationStatusDetails?.comments || null,
                updatedAs: applicationStatusDetails?.updatedAs || null
              }
            : null,
          documents,
        };
      })
    );

    res.status(200).json({
      success: true,
      students: studentsWithDocuments,
    });
  })
);

export default router;