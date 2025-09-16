import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import environment from "@/config/environment.ts";
import { phdSchemas } from "lib";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const assignments = await db.query.phdExaminerAssignments.findMany({
            where: (cols, { eq }) => eq(cols.examinerEmail, req.user!.email),
            with: {
                application: {
                    columns: {
                        qualifyingArea1: true,
                        qualifyingArea1SyllabusFileId: true,
                        qualifyingArea2: true,
                        qualifyingArea2SyllabusFileId: true,
                    },
                    with: {
                        student: {
                            columns: {
                                name: true,
                                email: true,
                                idNumber: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
        });

        const data: phdSchemas.ExaminerAssignmentsResponse = assignments.map(
            (a) => {
                const syllabusFileId =
                    a.application.qualifyingArea1 === a.qualifyingArea
                        ? a.application.qualifyingArea1SyllabusFileId
                        : a.application.qualifyingArea2SyllabusFileId;

                return {
                    id: a.id,
                    student: {
                        name: a.application.student.name,
                        email: a.application.student.email,
                        idNumber: a.application.student.idNumber,
                        phone: a.application.student.phone,
                    },
                    qualifyingArea: a.qualifyingArea,
                    syllabusFile:
                        environment.SERVER_URL + "/f/" + syllabusFileId,
                    hasAccepted: a.hasAccepted,
                };
            }
        );

        res.status(200).json(data);
    })
);
