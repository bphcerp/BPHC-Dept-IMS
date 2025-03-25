import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { applications, fileFields, files, textFields } from "@/config/db/schema/form.ts";
import { eq, sql, desc, and } from "drizzle-orm";
import environment from "@/config/environment.ts";
import { modules } from "lib";

const router = express.Router();

export default router.get(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    // Ensure the user is a supervisor
    const supervisorEmail = req.user?.email;
    if (!supervisorEmail) {
      return next(new HttpError(HttpCode.UNAUTHORIZED, "Unauthorized access"));
    }

    // Fetch students under this supervisor
    const students = await db
      .select({
        name: phd.name,
        email: phd.email,
        erpId: phd.erpId,
      })
      .from(phd)
      .where(eq(phd.supervisorEmail, supervisorEmail));

    if (!students.length) {
      return next(new HttpError(HttpCode.NOT_FOUND, "No students found"));
    }

    // Process students with proposal documents
    const studentsWithProposals = await Promise.all(
      students.map(async (student) => {
        // Check if application exists for proposal module
        const applicationExists = await db
          .select({ id: applications.id })
          .from(applications)
          .where(
            and(
              eq(applications.userEmail, student.email),
              eq(applications.module, modules[3])
            )
          )
          .limit(1);

        if (!applicationExists.length) {
          return null; // Skip students without proposal applications
        }

        // Fetch proposal documents
        const proposalDocuments = await db
          .select({
            id: fileFields.id,
            fieldName: fileFields.fieldName,
            fileName: files.originalName,
            fileUrl: sql`CONCAT(${environment.SERVER_URL}::text, '/f/', ${files.id})`.as("fileUrl"),
            uploadedAt: files.createdAt,
          })
          .from(fileFields)
          .innerJoin(files, eq(fileFields.fileId, files.id))
          .where(
            and(
              eq(fileFields.userEmail, student.email),
              eq(fileFields.module, modules[3]),
              sql`${fileFields.fieldName} IN ('proposalDocument1', 'proposalDocument2', 'proposalDocument3')`
            )
          )
          .orderBy(desc(files.createdAt));

        // Fetch supervisor information
        const supervisorInfo = await db
          .select({
            supervisor: textFields.value,
          })
          .from(textFields)
          .where(
            and(
              eq(textFields.userEmail, student.email),
              eq(textFields.module, modules[3]),
              eq(textFields.fieldName, "supervisor")
            )
          )
          .limit(1);

        return {
          name: student.name,
          email: student.email,
          erpId: student.erpId,
          supervisor: supervisorInfo[0]?.supervisor || null,
          proposalDocuments: proposalDocuments.length ? proposalDocuments : null,
        };
      })
    );

    // Filter out null entries (students without proposals)
    const filteredStudents = studentsWithProposals.filter(student => student !== null);

    if (!filteredStudents.length) {
      return next(new HttpError(HttpCode.NOT_FOUND, "No proposal documents found"));
    }

    res.json({
      success: true,
      students: filteredStudents,
    });
  })
);