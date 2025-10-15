import { Router } from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { instructorSupervisorGrades } from "@/config/db/schema/phd.ts";
import { createTodos, createNotifications } from "@/lib/todos/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const sendEndsemNotificationSchema = z.object({
    courseNames: z.array(z.string()).min(1), 
    subject: z.string().min(1),
    body: z.string().min(1),
});

router.post(
    "/",
    checkAccess("grades:manage"),
    asyncHandler(async (req, res) => {
        const { courseNames, subject, body } = sendEndsemNotificationSchema.parse(req.body);

        const instructorStudents = await db.query.instructorSupervisorGrades.findMany({
            where: and(
                eq(instructorSupervisorGrades.role, 'instructor')
            ),
        });

        const filteredStudents = instructorStudents.filter(s =>
            courseNames.includes(s.courseName) && (s.phase === 'midsem' || s.phase === 'endsem')
        );

        const midsemStudents = filteredStudents.filter(s => s.phase === 'midsem');
        const endsemStudents = filteredStudents.filter(s => s.phase === 'endsem');

        if (filteredStudents.length === 0) {
            res.status(400).json({
                success: false,
                message: "No instructor-assigned students found for the selected courses (midsem/endsem phase)",
            });
            return;
        }
        if (midsemStudents.length > 0) {
            for (const courseName of courseNames) {
                await db.update(instructorSupervisorGrades)
                    .set({ phase: 'endsem' })
                    .where(and(
                        eq(instructorSupervisorGrades.courseName, courseName),
                        eq(instructorSupervisorGrades.role, 'instructor'),
                        eq(instructorSupervisorGrades.phase, 'midsem')
                    ));
            }
        }

        const studentsToNotify = endsemStudents.length > 0 ? endsemStudents : filteredStudents;
        const instructorMap = new Map<string, Array<{ courseName: string; studentCount: number }>>();

        studentsToNotify.forEach(student => {
            if (!instructorMap.has(student.instructorSupervisorEmail)) {
                instructorMap.set(student.instructorSupervisorEmail, []);
            }
            const existing = instructorMap.get(student.instructorSupervisorEmail)!;
            const courseEntry = existing.find(c => c.courseName === student.courseName);
            if (courseEntry) {
                courseEntry.studentCount++;
            } else {
                existing.push({ courseName: student.courseName, studentCount: 1 });
            }
        });

        const todosToCreate = Array.from(instructorMap.entries()).map(([email, courses]) => {
            const courseList = courses.map(c => `${c.courseName} (${c.studentCount} students)`).join(', ');
            return {
                assignedTo: email,
                createdBy: req.user!.email,
                title: `Submit Endsem Grades`,
                description: `Please submit endsem grades and upload endsem reports for your assigned students in: ${courseList}`,
                module: "Grades" as any,
                completionEvent: `grades:endsem-submit:${email}`,
                link: `/grades/assign-grades`,
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
            };
        });

        await createTodos(todosToCreate);

        const notificationsToCreate = Array.from(instructorMap.entries()).map(([email, courses]) => {
            const courseList = courses.map(c => c.courseName).join(', ');
            return {
                userEmail: email,
                module: "Grades" as any,
                title: `Endsem Grades Due`,
                content: `Please submit endsem grades and upload endsem reports for your assigned students in: ${courseList}`,
                link: `/grades/assign-grades`,
            };
        });

        await createNotifications(notificationsToCreate);

        // Send ONE email per instructor
        const emailsToSend = Array.from(instructorMap.entries()).map(([email, courses]) => {
            const courseList = courses.map(c => `${c.courseName} (${c.studentCount} students)`).join('\n  - ');
            return {
                to: email,
                subject: subject,
                text: `${body}\n\nCourses:\n  - ${courseList}\n\nPlease log in to the system to submit endsem grades: ${process.env.FRONTEND_URL}/grades/assign-grades`,
            };
        });

        await sendBulkEmails(emailsToSend);

        res.json({
            success: true,
            message: `Endsem notification sent to ${instructorMap.size} instructors for ${filteredStudents.length} students across ${courseNames.length} courses`,
            data: {
                instructorsNotified: instructorMap.size,
                studentsAffected: filteredStudents.length,
                coursesAffected: courseNames.length,
                todosCreated: todosToCreate.length,
                notificationsCreated: notificationsToCreate.length,
            }
        });
    })
);

export default router;
