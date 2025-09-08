import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import {
    phdExamApplications,
    phdExamTimetableSlots,
} from "@/config/db/schema/phd.ts";
import { and, eq } from "drizzle-orm";

const router = express.Router();

router.post(
    "/:examId",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const examId = parseInt(req.params.examId);
        if (isNaN(examId) || examId < 0) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid Exam ID");
        }

        const apps = await db.query.phdExamApplications.findMany({
            where: and(
                eq(phdExamApplications.examId, examId),
                eq(phdExamApplications.status, "verified")
            ),
            with: { student: true, examinerAssignments: true },
        });

        const validApps = apps.filter(
            (app) => app.examinerAssignments.length === 2
        );

        if (validApps.length === 0) {
            await db
                .delete(phdExamTimetableSlots)
                .where(eq(phdExamTimetableSlots.examId, examId));
            res.status(200).json({
                message: "No applications with assigned examiners to schedule.",
            });
        } else {
            // --- Scheduling Algorithm using Graph 2-Coloring ---
            const studentToGroups = new Map<string, string[]>();
            const groupToStudents = new Map<string, string[]>();
            const allGroups = new Set<string>();

            for (const app of validApps) {
                const group1Key = `${app.examinerAssignments[0].qualifyingArea}#${app.examinerAssignments[0].examinerEmail}`;
                const group2Key = `${app.examinerAssignments[1].qualifyingArea}#${app.examinerAssignments[1].examinerEmail}`;

                allGroups.add(group1Key);
                allGroups.add(group2Key);

                if (!groupToStudents.has(group1Key))
                    groupToStudents.set(group1Key, []);
                groupToStudents.get(group1Key)!.push(app.studentEmail);

                if (!groupToStudents.has(group2Key))
                    groupToStudents.set(group2Key, []);
                groupToStudents.get(group2Key)!.push(app.studentEmail);

                studentToGroups.set(app.studentEmail, [group1Key, group2Key]);
            }

            const adj = new Map<string, Set<string>>();
            allGroups.forEach((g) => adj.set(g, new Set()));

            for (const [, groups] of studentToGroups) {
                if (groups.length === 2 && groups[0] !== groups[1]) {
                    adj.get(groups[0])!.add(groups[1]);
                    adj.get(groups[1])!.add(groups[0]);
                }
            }

            const colors = new Map<string, number>(); // 1: slot 1, 2: slot 2
            let isBipartite = true;

            for (const group of allGroups) {
                if (!isBipartite) break;
                if (!colors.has(group)) {
                    const q = [group];
                    colors.set(group, 1);
                    let head = 0;
                    while (head < q.length) {
                        const u = q[head++];
                        for (const v of adj.get(u)!) {
                            if (!colors.has(v)) {
                                colors.set(v, 3 - colors.get(u)!);
                                q.push(v);
                            } else if (colors.get(u) === colors.get(v)) {
                                isBipartite = false;
                                break;
                            }
                        }
                        if (!isBipartite) break;
                    }
                }
                if (!isBipartite) break;
            }

            const timetableSlots: (typeof phdExamTimetableSlots.$inferInsert)[] =
                [];

            if (!isBipartite) {
                validApps.forEach((app) => {
                    app.examinerAssignments.forEach((asgn) => {
                        timetableSlots.push({
                            examId,
                            studentEmail: app.studentEmail,
                            qualifyingArea: asgn.qualifyingArea,
                            examinerEmail: asgn.examinerEmail,
                            slotNumber: 0,
                        });
                    });
                });
            } else {
                validApps.forEach((app) => {
                    const [group1Key, group2Key] = studentToGroups.get(
                        app.studentEmail
                    )!;
                    const slot1 = colors.get(group1Key);
                    const slot2 = colors.get(group2Key);

                    const [area1, examiner1] = group1Key.split("#");
                    timetableSlots.push({
                        examId,
                        studentEmail: app.studentEmail,
                        qualifyingArea: area1,
                        examinerEmail: examiner1,
                        slotNumber: slot1,
                    });

                    const [area2, examiner2] = group2Key.split("#");
                    timetableSlots.push({
                        examId,
                        studentEmail: app.studentEmail,
                        qualifyingArea: area2,
                        examinerEmail: examiner2,
                        slotNumber: slot2,
                    });
                });
            }

            await db.transaction(async (tx) => {
                await tx
                    .delete(phdExamTimetableSlots)
                    .where(eq(phdExamTimetableSlots.examId, examId));
                if (timetableSlots.length > 0) {
                    await tx
                        .insert(phdExamTimetableSlots)
                        .values(timetableSlots);
                }
            });

            res.status(200).json({
                success: true,
                message: "Timetable optimized successfully.",
            });
        }
    })
);

export default router;
