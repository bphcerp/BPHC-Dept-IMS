import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import {
    fileFields,
    applications,
    textFields,
    files,
} from "@/config/db/schema/form.ts";
import { phdQualifyingExams, phdSemesters } from "@/config/db/schema/phd.ts";
import { eq, sql, desc, and } from "drizzle-orm";
import environment from "@/config/environment.ts";
import { modules } from "lib";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res, next) => {
        // Fetch semesters
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

        // Process semesters with exams
        const semestersWithExams = await Promise.all(
            semesters.map(async (semester) => {
                const exams = await db
                    .select({
                        id: phdQualifyingExams.id,
                        examName: phdQualifyingExams.examName,
                        deadline: phdQualifyingExams.deadline,
                    })
                    .from(phdQualifyingExams)
                    .where(
                        and(
                            eq(phdQualifyingExams.semesterId, semester.id),
                            eq(
                                phdQualifyingExams.examName,
                                "Regular Qualifying Exam"
                            )
                        )
                    )
                    .orderBy(desc(phdQualifyingExams.deadline));

                // Process exams with students
                const examsWithStudents = await Promise.all(
                    exams.map(async (exam) => {
                        const deadlineDate = new Date(exam.deadline);
                        const threeMonthsBefore = new Date(deadlineDate);
                        threeMonthsBefore.setMonth(deadlineDate.getMonth() - 5);

                        // Get students who filled the application form
                        const students = await db
                            .select({
                                name: phd.name,
                                email: phd.email,
                                erpId: phd.erpId,
                                examStatus1: phd.qualifyingExam1,
                                examStatus2: phd.qualifyingExam2,
                                examDateStart1: phd.qualifyingExam1StartDate,
                                examDateEnd1: phd.qualifyingExam1EndDate,
                                examDateStart2: phd.qualifyingExam2StartDate,
                                examDateEnd2: phd.qualifyingExam2EndDate,
                                maxCreatedAt: sql`MAX(${applications.createdAt})`.as('maxCreatedAt'),
                            })
                            .from(phd)
                            .innerJoin(
                                applications,
                                eq(phd.email, applications.userEmail)
                            )
                            .where(
                                and(
                                    eq(applications.module, modules[4]),
                                    sql`${applications.createdAt} BETWEEN ${threeMonthsBefore} AND ${deadlineDate}`
                                )
                            ).groupBy(
                                phd.email,
                                phd.name,
                                phd.erpId,
                                phd.qualifyingExam1,
                                phd.qualifyingExam2,
                                phd.qualifyingExam1StartDate,
                                phd.qualifyingExam1EndDate,
                                phd.qualifyingExam2StartDate,
                                phd.qualifyingExam2EndDate
                            );
                            

                        // Process students with documents
                        const studentsWithDocuments = await Promise.all(
                            students.map(async (student) => {
                                const qualificationForm = await db
                                    .select({
                                        id: files.id,
                                        fileName: files.originalName,
                                        fileUrl:
                                            sql`CONCAT(${environment.SERVER_URL}::text, '/f/', ${files.id})`.as(
                                                "fileUrl"
                                            ),
                                        uploadedAt: files.createdAt,
                                    })
                                    .from(fileFields)
                                    .innerJoin(
                                        files,
                                        eq(fileFields.fileId, files.id)
                                    )
                                    .where(
                                        and(
                                            eq(
                                                fileFields.userEmail,
                                                student.email
                                            ),
                                            eq(
                                                fileFields.fieldName,
                                                "qualificationForm"
                                            ),
                                            eq(fileFields.module, modules[4])
                                        )
                                    )
                                    .orderBy(desc(files.createdAt))
                                    .limit(1);

                                // Fetch text fields for qualifying areas
                                const textFieldsData = await db
                                    .select({
                                        fieldName: textFields.fieldName,
                                        value: textFields.value,
                                    })
                                    .from(textFields)
                                    .where(
                                        and(
                                            eq(
                                                textFields.userEmail,
                                                student.email
                                            ),
                                            eq(textFields.module, modules[4]),
                                            sql`${textFields.fieldName} IN ('qualifyingArea1', 'qualifyingArea2')`
                                        )
                                    );

                                // Initialize qualifying areas
                                const qualifyingAreas: Record<
                                    string,
                                    string | null
                                > = {
                                    qualifyingArea1: null,
                                    qualifyingArea2: null,
                                };

                                textFieldsData.forEach((field) => {
                                    if (field.fieldName) {
                                        qualifyingAreas[field.fieldName] =
                                            field.value;
                                    }
                                });

                                // Determine exam status & date
                                const examStatus =
                                    student.examStatus1 ??
                                    student.examStatus2 ??
                                    null;
                                const examDate =
                                    student.examDateStart1 ??
                                    student.examDateStart2 ??
                                    null;

                                // Get the application's created timestamp
                                const applicationTimestamp = await db
                                    .select({
                                        createdAt: applications.createdAt,
                                    })
                                    .from(applications)
                                    .where(
                                        and(
                                            eq(
                                                applications.userEmail,
                                                student.email
                                            ),
                                            eq(applications.module, modules[4])
                                        )
                                    )
                                    .orderBy(desc(applications.createdAt))
                                    .limit(1);

                                return {
                                    name: student.name,
                                    email: student.email,
                                    erpId: student.erpId,
                                    formName:
                                        qualificationForm[0]?.fileName ??
                                        "Application Form",
                                    fileUrl:
                                        qualificationForm[0]?.fileUrl ?? null,
                                    uploadedAt:
                                        applicationTimestamp[0]?.createdAt ||
                                        new Date().toISOString(),
                                    qualifyingArea1:
                                        qualifyingAreas.qualifyingArea1,
                                    qualifyingArea2:
                                        qualifyingAreas.qualifyingArea2,
                                    examStatus,
                                    examDate,
                                };
                            })
                        );

                        return {
                            ...exam,
                            students: studentsWithDocuments,
                        };
                    })
                );

                return {
                    ...semester,
                    exams: examsWithStudents,
                };
            })
        );

        res.json({
            success: true,
            semestersWithExams,
        });
    })
);
