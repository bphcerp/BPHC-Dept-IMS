import { Router } from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { instructorSupervisorGrades } from "@/config/db/schema/phd.ts";
import { createTodos, createNotifications } from "@/lib/todos/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import environment from "@/config/environment.ts";

const router = Router();

const sendMidsemNotificationSchema = z.object({
    courseNames: z.array(z.string()).min(1),
    subject: z.string().min(1),
    body: z.string().min(1),
});

router.post(
    "/",
    checkAccess("grades:manage"),
    asyncHandler(async (req, res) => {
        const { courseNames, subject, body } =
            sendMidsemNotificationSchema.parse(req.body);

        const instructorStudents =
            await db.query.instructorSupervisorGrades.findMany({
                where: and(eq(instructorSupervisorGrades.role, "instructor")),
            });

        const filteredStudents = instructorStudents.filter(
            (s) =>
                courseNames.includes(s.courseName) &&
                (s.phase === "draft" || s.phase === "midsem")
        );

        const draftStudents = filteredStudents.filter(
            (s) => s.phase === "draft"
        );
        const midsemStudents = filteredStudents.filter(
            (s) => s.phase === "midsem"
        );

        if (filteredStudents.length === 0) {
            res.status(400).json({
                success: false,
                message:
                    "No instructor-assigned students found for the selected courses who still need midsem notifications",
            });
            return;
        }

        let studentsToNotify;
        if (draftStudents.length > 0 && midsemStudents.length === 0) {
            studentsToNotify = filteredStudents;
        } else {
            studentsToNotify = midsemStudents;
        }

        if (studentsToNotify.length === 0) {
            res.status(400).json({
                success: false,
                message:
                    "No instructors found who still need midsem reminder notifications (all have already submitted or are in draft phase)",
            });
            return;
        }

        if (draftStudents.length > 0 && midsemStudents.length === 0) {
            await db
                .update(instructorSupervisorGrades)
                .set({ phase: "midsem" })
                .where(
                    and(
                        inArray(
                            instructorSupervisorGrades.courseName,
                            courseNames
                        ),
                        eq(instructorSupervisorGrades.role, "instructor"),
                        eq(instructorSupervisorGrades.phase, "draft")
                    )
                );
        }
        const instructorMap = new Map<
            string,
            Array<{ courseName: string; studentCount: number }>
        >();

        studentsToNotify.forEach((student) => {
            if (!instructorMap.has(student.instructorSupervisorEmail)) {
                instructorMap.set(student.instructorSupervisorEmail, []);
            }
            const existing = instructorMap.get(
                student.instructorSupervisorEmail
            )!;
            const courseEntry = existing.find(
                (c) => c.courseName === student.courseName
            );
            if (courseEntry) {
                courseEntry.studentCount++;
            } else {
                existing.push({
                    courseName: student.courseName,
                    studentCount: 1,
                });
            }
        });

        const todosToCreate = Array.from(instructorMap.entries()).map(
            ([email, courses]) => {
                const courseList = courses
                    .map((c) => `${c.courseName} (${c.studentCount} students)`)
                    .join(", ");
                return {
                    assignedTo: email,
                    createdBy: req.user!.email,
                    title: `Submit Midsem Grades`,
                    description: `Please submit midsem grades and upload midsem reports for your assigned students in: ${courseList}`,
                    module: "Grades" as any,
                    completionEvent: `grades:midsem-submit:${email}`,
                    link: `/grades/assign-grades`,
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                };
            }
        );

        await createTodos(todosToCreate);

        const notificationsToCreate = Array.from(instructorMap.entries()).map(
            ([email, courses]) => {
                const courseList = courses.map((c) => c.courseName).join(", ");
                return {
                    userEmail: email,
                    module: "Grades" as any,
                    title: `Midsem Grades Due`,
                    content: `Please submit midsem grades and upload midsem reports for your assigned students in: ${courseList}`,
                    link: `/grades/assign-grades`,
                };
            }
        );

        await createNotifications(notificationsToCreate);

        const emailsToSend = Array.from(instructorMap.entries()).map(
            ([email, courses]) => {
                const courseList = courses
                    .map((c) => `${c.courseName} (${c.studentCount} students)`)
                    .join("\n  - ");
                return {
                    to: email,
                    subject: subject,
                    text: `${body}\n\nCourses:\n  - ${courseList}\n\nPlease log in to the system to submit midsem grades: ${environment.FRONTEND_URL}/grades/assign-grades`,
                };
            }
        );

        sendBulkEmails(emailsToSend);

        res.json({
            success: true,
            message: `Midsem notification sent to ${instructorMap.size} instructors for ${studentsToNotify.length} students across ${courseNames.length} courses`,
            data: {
                instructorsNotified: instructorMap.size,
                studentsAffected: studentsToNotify.length,
                coursesAffected: courseNames.length,
                todosCreated: todosToCreate.length,
                notificationsCreated: notificationsToCreate.length,
            },
        });
    })
);

export default router;
