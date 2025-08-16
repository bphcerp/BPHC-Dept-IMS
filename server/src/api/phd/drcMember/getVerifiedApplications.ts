import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import {
    phdQualifyingExams,
    phdExamApplications,
} from "@/config/db/schema/phd.ts";
import { eq, and, desc } from "drizzle-orm";
const router = express.Router();
export default router.get(
    "/:examId",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { examId } = req.params;
        if (!examId) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Exam ID is required as path parameter"
                )
            );
        }
        const examExists = await db.query.phdQualifyingExams.findFirst({
            where: eq(phdQualifyingExams.id, parseInt(examId)),
        });
        if (!examExists) {
            return next(new HttpError(HttpCode.NOT_FOUND, "Exam not found"));
        }
        const verifiedApplications =
            await db.query.phdExamApplications.findMany({
                where: and(
                    eq(phdExamApplications.examId, parseInt(examId)),
                    eq(phdExamApplications.status, "verified")
                ),
                with: {
                    student: true,
                    examinerSuggestions: { columns: { id: true } },
                    examinerAssignments: true,
                },
                orderBy: desc(phdExamApplications.createdAt),
            });
        const transformedApplications = verifiedApplications.map((app) => ({
            id: app.id,
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
                coSupervisor1: app.student.coSupervisorEmail,
                coSupervisor2: app.student.coSupervisorEmail2,
            },
            examinerSuggestionCount: app.examinerSuggestions.length,
            examinerAssignmentCount: app.examinerAssignments.length,
            examinerAssignments: app.examinerAssignments.map((a) => ({
                examinerEmail: a.examinerEmail,
                qualifyingArea: a.qualifyingArea,
            })),
            result: app.result,
            qualificationDate: app.student.qualificationDate,
        }));
        res.json(transformedApplications);
    })
);
