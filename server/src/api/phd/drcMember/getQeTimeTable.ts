import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdSubAreas, phdExaminer } from "@/config/db/schema/phd.ts";
import { and, inArray, isNotNull } from "drizzle-orm";

const router = express.Router();

type ExamGroup = {
    email: string;
    name: string;
    subAreaId: number;
    subArea: string;
    examiner: string;
};

type Session = {
    sessionNumber: number;
    exams: ExamGroup[];
};

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res, next) => {
        try {
            const sessionCount = 2;
            const students = await db
                .select({
                    email: phd.email,
                    name: phd.name,
                    qualifyingArea1: phd.qualifyingArea1,
                    qualifyingArea2: phd.qualifyingArea2,
                })
                .from(phd)
                .where(
                    and(
                        isNotNull(phd.qualifyingArea1),
                        isNotNull(phd.qualifyingArea2)
                    )
                );

            if (students.length === 0) {
                return next(
                    new HttpError(HttpCode.NOT_FOUND, "No student area found")
                );
            }

            const allSubAreas = await db.select().from(phdSubAreas);
            const subAreaNameById = new Map(
                allSubAreas.map((area) => [area.id, area.subarea])
            );

            const qualifyingAreaIds: number[] = [];
            students.forEach((student) => {
                if (student.qualifyingArea1) {
                    const areaId = parseInt(student.qualifyingArea1);
                    if (!isNaN(areaId) && subAreaNameById.has(areaId)) {
                        qualifyingAreaIds.push(areaId);
                    }
                }
                if (student.qualifyingArea2) {
                    const areaId = parseInt(student.qualifyingArea2);
                    if (!isNaN(areaId) && subAreaNameById.has(areaId)) {
                        qualifyingAreaIds.push(areaId);
                    }
                }
            });

            if (qualifyingAreaIds.length === 0) {
                return next(
                    new HttpError(
                        HttpCode.NOT_FOUND,
                        "No qualifying area found"
                    )
                );
            }

            const examiners = await db
                .select()
                .from(phdExaminer)
                .where(inArray(phdExaminer.subAreaId, qualifyingAreaIds));

            const examinerMap = new Map<number, string>();
            examiners.forEach((examiner) => {
                if (examiner.examiner) {
                    examinerMap.set(examiner.subAreaId, examiner.examiner);
                }
            });

            const studentExams: ExamGroup[] = [];
            students.forEach((student) => {
                if (student.qualifyingArea1) {
                    const areaId = parseInt(student.qualifyingArea1);
                    if (!isNaN(areaId) && examinerMap.has(areaId)) {
                        studentExams.push({
                            email: student.email,
                            name: student.name || "",
                            subAreaId: areaId,
                            subArea: subAreaNameById.get(areaId) || "",
                            examiner: examinerMap.get(areaId) || "",
                        });
                    }
                }
                if (student.qualifyingArea2) {
                    const areaId = parseInt(student.qualifyingArea2);
                    if (!isNaN(areaId) && examinerMap.has(areaId)) {
                        studentExams.push({
                            email: student.email,
                            name: student.name || "",
                            subAreaId: areaId,
                            subArea: subAreaNameById.get(areaId) || "",
                            examiner: examinerMap.get(areaId) || "",
                        });
                    }
                }
            });

            if (studentExams.length === 0) {
                return next(
                    new HttpError(
                        HttpCode.NOT_FOUND,
                        "No qualifying exam found"
                    )
                );
            }

            const examGroupsBySubAreaAndExaminer = new Map<
                string,
                ExamGroup[]
            >();
            studentExams.forEach((exam) => {
                const key = `${exam.subAreaId}-${exam.examiner}`;
                if (!examGroupsBySubAreaAndExaminer.has(key)) {
                    examGroupsBySubAreaAndExaminer.set(key, []);
                }
                examGroupsBySubAreaAndExaminer.get(key)!.push(exam);
            });

            const studentsByEmail = new Map<string, ExamGroup[]>();
            studentExams.forEach((exam) => {
                if (!studentsByEmail.has(exam.email)) {
                    studentsByEmail.set(exam.email, []);
                }
                studentsByEmail.get(exam.email)!.push(exam);
            });

            const sessions: ExamGroup[][] = Array.from(
                { length: sessionCount },
                () => []
            );

            const examGroupSessionMap = new Map<string, number>(); 
            const studentAssignedSessions = new Map<string, Set<number>>(); 

            for (const [
                key,
                exams,
            ] of examGroupsBySubAreaAndExaminer.entries()) {
                let bestSession = 0;
                let minConflicts = Infinity;

                for (
                    let sessionIndex = 0;
                    sessionIndex < sessionCount;
                    sessionIndex++
                ) {
                    let conflicts = 0;
                    for (const exam of exams) {
                        if (
                            studentAssignedSessions.has(exam.email) &&
                            studentAssignedSessions
                                .get(exam.email)!
                                .has(sessionIndex)
                        ) {
                            conflicts++;
                        }
                    }

                    if (conflicts < minConflicts) {
                        minConflicts = conflicts;
                        bestSession = sessionIndex;
                    }
                }

                examGroupSessionMap.set(key, bestSession);
                for (const exam of exams) {
                    if (!studentAssignedSessions.has(exam.email)) {
                        studentAssignedSessions.set(exam.email, new Set());
                    }
                    studentAssignedSessions.get(exam.email)!.add(bestSession);
                    sessions[bestSession].push(exam);
                }
            }

            const conflicts: string[] = [];
            for (const [
                email,
                assignedSessions,
            ] of studentAssignedSessions.entries()) {
                if (
                    assignedSessions.size < studentsByEmail.get(email)!.length
                ) {
                    conflicts.push(email);
                }
            }

            const formattedSessions: Session[] = sessions.map(
                (session, index) => ({
                    sessionNumber: index + 1,
                    exams: session,
                })
            );

            res.status(200).json({
                success: true,
                timetable: formattedSessions,
                conflicts: conflicts.length > 0 ? conflicts : undefined,
            });
        } catch (error) {
            console.error("Error generating exam timetable:", error);
            next(
                new HttpError(
                    HttpCode.INTERNAL_SERVER_ERROR,
                    "Failed to generate exam timetable"
                )
            );
        }
    })
);

export default router;
