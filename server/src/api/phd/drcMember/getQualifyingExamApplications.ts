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
            with: {
                semester: true,
            },
        });

        if (!examDetails) {
            return next(new HttpError(HttpCode.NOT_FOUND, "Exam not found"));
        }

        const applications = await db.query.phdExamApplications.findMany({
            where: eq(phdExamApplications.examId, parseInt(examId as string)),
            with: {
                student: true,
            },
            orderBy: desc(phdExamApplications.createdAt),
        });

        const transformedApplications = applications.map((app) => ({
            id: app.id,
            status: app.status,
            comments: app.comments,
            qualifyingArea1: app.qualifyingArea1,
            qualifyingArea2: app.qualifyingArea2,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt,
            student: {
                email: app.student.email,
                name: app.student.name,
                erpId: app.student.erpId,
                phone: app.student.phone,
                supervisor: app.student.supervisorEmail,
                coSupervisor1: app.student.coSupervisorEmail,
                coSupervisor2: app.student.coSupervisorEmail2,
            },
            files: {
                qualifyingArea1Syllabus: `${environment.SERVER_URL}/f/${app.qualifyingArea1SyllabusFileId}`,
                qualifyingArea2Syllabus: `${environment.SERVER_URL}/f/${app.qualifyingArea2SyllabusFileId}`,
                tenthReport: `${environment.SERVER_URL}/f/${app.tenthReportFileId}`,
                twelfthReport: `${environment.SERVER_URL}/f/${app.twelfthReportFileId}`,
                undergradReport: `${environment.SERVER_URL}/f/${app.undergradReportFileId}`,
                mastersReport: app.mastersReportFileId
                    ? `${environment.SERVER_URL}/f/${app.mastersReportFileId}`
                    : undefined,
            },
        }));

        res.json({
            exam: examDetails,
            applications: transformedApplications,
        });
    })
);
