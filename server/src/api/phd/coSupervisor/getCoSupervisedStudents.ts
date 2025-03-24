import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { fileFields, files, fileFieldStatus  } from "@/config/db/schema/form.ts";
import { eq, or, desc, sql } from "drizzle-orm";
import assert from "assert";
import environment from "@/config/environment.ts";

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

    // Fetch student documents
    const studentsWithDocuments = await Promise.all(
      students.map(async (student) => {
        // Fetch documents submitted by this student
        const documents = await db
          .select({
            id: fileFields.id,
            fieldName: fileFields.fieldName,
            fileName: files.originalName,
            fileUrl: sql`${environment.SERVER_URL}/api/f/${files.id}`.as("fileUrl"),
            uploadedAt: files.createdAt,
            status: fileFieldStatus.status,
            comments: fileFieldStatus.comments,
            reviewedBy: fileFieldStatus.updatedAs,
          })
          .from(fileFields)
          .innerJoin(files, eq(fileFields.fileId, files.id))
          .leftJoin(fileFieldStatus, eq(fileFields.id, fileFieldStatus.fileField))
          .where(eq(fileFields.userEmail, student.email))
          .orderBy(desc(files.createdAt));

        return {
          ...student,
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
