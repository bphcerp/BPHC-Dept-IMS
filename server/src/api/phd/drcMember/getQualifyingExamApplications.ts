import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import {
    phdQualifyingExams,
    phdExamApplications,
} from "@/config/db/schema/phd.ts";
import { eq, desc } from "drizzle-orm";
import environment from "@/config/environment.ts";
import { phdSchemas } from "lib";
const router = express.Router();
export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { examId } = req.query;
        if (!examId) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Exam ID is required as query parameter"
                )
            );
        }
        const examDetails = await db.query.phdQualifyingExams.findFirst({
            where: eq(phdQualifyingExams.id, parseInt(examId as string)),
            with: { semester: true },
        });
        if (!examDetails) {
            return next(new HttpError(HttpCode.NOT_FOUND, "Exam not found"));
        }
        const applications = await db.query.phdExamApplications.findMany({
            where: eq(phdExamApplications.examId, parseInt(examId as string)),
            with: {
                student: true,
                examinerSuggestions: { columns: { id: true } },
                examinerAssignments: { columns: { id: true } },
            },
            orderBy: desc(phdExamApplications.createdAt),
        });
        const transformedApplications = applications.map((app) => ({
            id: app.id,
            examId: app.examId,
            status: app.status,
            comments: app.comments,
            qualifyingArea1: app.qualifyingArea1,
            qualifyingArea2: app.qualifyingArea2,
            createdAt: app.createdAt.toISOString(),
            updatedAt: app.updatedAt.toISOString(),
            student: {
                email: app.student.email,
                name: app.student.name,
                erpId: app.student.erpId,
                phone: app.student.phone,
                supervisor: app.student.supervisorEmail,
                idNumber: app.student.idNumber,
            },
            files: {
                applicationForm: app.applicationFormFileId
                    ? `${environment.SERVER_URL}/f/${app.applicationFormFileId}`
                    : null,
                qualifyingArea1Syllabus: app.qualifyingArea1SyllabusFileId
                    ? `${environment.SERVER_URL}/f/${app.qualifyingArea1SyllabusFileId}`
                    : null,
                qualifyingArea2Syllabus: app.qualifyingArea2SyllabusFileId
                    ? `${environment.SERVER_URL}/f/${app.qualifyingArea2SyllabusFileId}`
                    : null,
                tenthReport: app.tenthReportFileId
                    ? `${environment.SERVER_URL}/f/${app.tenthReportFileId}`
                    : null,
                twelfthReport: app.twelfthReportFileId
                    ? `${environment.SERVER_URL}/f/${app.twelfthReportFileId}`
                    : null,
                undergradReport: app.undergradReportFileId
                    ? `${environment.SERVER_URL}/f/${app.undergradReportFileId}`
                    : null,
                mastersReport: app.mastersReportFileId
                    ? `${environment.SERVER_URL}/f/${app.mastersReportFileId}`
                    : null,
            },
        }));
        const response: phdSchemas.QualifyingExamApplicationsResponse = {
            exam: {
                id: examDetails.id,
                examinerCount: examDetails.examinerCount,
                semesterId: examDetails.semesterId,
                examName: examDetails.examName,
                examStartDate: examDetails.examStartDate.toISOString(),
                examEndDate: examDetails.examEndDate.toISOString(),
                submissionDeadline:
                    examDetails.submissionDeadline.toISOString(),
                vivaDate: examDetails.vivaDate?.toISOString() || null,
                createdAt: examDetails.createdAt.toISOString(),
                updatedAt: examDetails.updatedAt.toISOString(),
                semester: {
                    id: examDetails.semester.id,
                    year: examDetails.semester.year,
                    semesterNumber: examDetails.semester.semesterNumber,
                    startDate: examDetails.semester.startDate.toISOString(),
                    endDate: examDetails.semester.endDate.toISOString(),
                    createdAt: examDetails.semester.createdAt.toISOString(),
                    updatedAt: examDetails.semester.updatedAt.toISOString(),
                },
            },
            applications: transformedApplications,
        };
        res.json(response);
    })
);
