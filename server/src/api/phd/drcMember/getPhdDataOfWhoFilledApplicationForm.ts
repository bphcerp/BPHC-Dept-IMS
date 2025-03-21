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
  asyncHandler(async (_req, res, next) => {
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

    if (!semesters.length) {
      return next(
        new HttpError(HttpCode.NOT_FOUND, "No semesters found")
      );
    }

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

        const examsWithStudents = await Promise.all(
          exams.map(async (exam) => {
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
                examStatus1: phd.qualifyingExam1,
                examStatus2: phd.qualifyingExam2,
                examDate1: phd.qualifyingExam1Date,
                examDate2: phd.qualifyingExam2Date,
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

            // Process the students to determine their current exam status and date
            const processedStudents = students.map(student => {
              // First determine if they've taken an exam already
              let examStatus = null;
              let examDate = null;
              
              // Check if they've passed their first exam
              if (student.examStatus1 !== null) {
                examStatus = student.examStatus1;
                examDate = student.examDate1;
              } 
              // Check if they're on their second exam
              else if (student.examStatus2 !== null) {
                examStatus = student.examStatus2;
                examDate = student.examDate2;
              }
              
              return {
                name: student.name,
                email: student.email,
                erpId: student.erpId,
                fileUrl: student.fileUrl,
                formName: student.formName,
                uploadedAt: student.uploadedAt,
                examStatus,
                examDate
              };
            });

            return {
              ...exam,
              students: processedStudents
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