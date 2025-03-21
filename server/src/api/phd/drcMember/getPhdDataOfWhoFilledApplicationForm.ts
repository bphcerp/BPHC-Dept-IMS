import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdDocuments, phdQualifyingExams, phdSemesters } from "@/config/db/schema/phd.ts";
import { eq, sql, desc, and } from "drizzle-orm";

const router = express.Router();

export default router.get(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    // Get all semesters
    const semesters = await db
      .select({
        id: phdSemesters.id,
        year: phdSemesters.year,
        semesterNumber: phdSemesters.semesterNumber,
        startDate: phdSemesters.startDate,
        endDate: phdSemesters.endDate,
      })
      .from(phdSemesters)
      .orderBy(desc(phdSemesters.year), phdSemesters.semesterNumber);

    // If no semesters found, return error
    if (!semesters.length) {
      return next(
        new HttpError(HttpCode.NOT_FOUND, "No semesters found")
      );
    }

    // For each semester, get all qualifying exams
    const semestersWithExams = await Promise.all(
      semesters.map(async (semester) => {
        const exams = await db
          .select({
            id: phdQualifyingExams.id,
            examName: phdQualifyingExams.examName,
            deadline: phdQualifyingExams.deadline,
          })
          .from(phdQualifyingExams)
          .where(eq(phdQualifyingExams.semesterId, semester.id))
          .orderBy(desc(phdQualifyingExams.deadline));

        // For each exam, get all students who applied
        const examsWithStudents = await Promise.all(
          exams.map(async (exam) => {
            // For qualifying exams, we need to check the documents uploaded within 
            // a reasonable time frame around the exam deadline
            const deadlineDate = new Date(exam.deadline);
            const threeMonthsBefore = new Date(deadlineDate);
            threeMonthsBefore.setMonth(deadlineDate.getMonth() - 3);
            
            const students = await db
              .select({
                name: phd.name,
                email: phd.email,
                erpId: phd.erpId,
                fileUrl: phdDocuments.fileUrl,
                formName: phdDocuments.formName,
                uploadedAt: phdDocuments.uploadedAt,
              })
              .from(phd)
              .innerJoin(phdDocuments, eq(phd.email, phdDocuments.email))
              .where(
                and(
                  sql`TRIM(BOTH '"' FROM ${phdDocuments.applicationType})='qualifying_exam'`,
                  sql`${phdDocuments.uploadedAt} BETWEEN ${threeMonthsBefore} AND ${deadlineDate}`
                )
              )
              .orderBy(desc(phdDocuments.uploadedAt));

            return {
              ...exam,
              students
            };
          })
        );

        return {
          ...semester,
          exams: examsWithStudents
        };
      })
    );

    res.json({ 
      success: true, 
      semestersWithExams 
    });
  })
);