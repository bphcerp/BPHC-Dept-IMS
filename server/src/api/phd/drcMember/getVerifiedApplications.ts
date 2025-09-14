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
import { modules, phdSchemas } from "lib";
import { todoExists } from "@/lib/todos/index.ts";
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
                    examinerSuggestions: true,
                    examinerAssignments: true,
                },
                orderBy: desc(phdExamApplications.createdAt),
            });

        const supervisorTodosExist = await todoExists(
            verifiedApplications.map((app) => ({
                module: modules[4],
                completionEvent: `supervisor-suggest-for-${app.id}-exam-${app.examId}`,
                assignedTo: app.student.supervisorEmail ?? "",
            }))
        );

        const transformedApplications: Array<phdSchemas.VerifiedApplication> =
            verifiedApplications.map((app, index) => ({
                id: app.id,
                examId: app.examId,
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
                examinerAssignments: app.examinerAssignments.reduce(
                    (acc, assignment) => {
                        acc[assignment.qualifyingArea] = {
                            examinerEmail: assignment.examinerEmail,
                            notifiedAt: assignment.notifiedAt
                                ? assignment.notifiedAt.toISOString()
                                : null,
                            qpSubmitted: assignment.qpSubmitted,
                            hasAccepted: assignment.hasAccepted,
                        };
                        return acc;
                    },
                    {} as Record<
                        string,
                        {
                            examinerEmail: string;
                            notifiedAt: string | null;
                            qpSubmitted: boolean;
                            hasAccepted: boolean | null;
                        }
                    >
                ),
                examinerSuggestions: app.examinerSuggestions.reduce(
                    (acc, suggestion) => {
                        acc[suggestion.qualifyingArea] =
                            suggestion.suggestedExaminers;
                        return acc;
                    },
                    {} as Record<string, string[]>
                ),
                result: app.result,
                qualificationDate: app.student.qualificationDate
                    ? app.student.qualificationDate.toISOString()
                    : null,
                supervisorTodoExists: supervisorTodosExist[index],
            }));
        res.json(transformedApplications);
    })
);
