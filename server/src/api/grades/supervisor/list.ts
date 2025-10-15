import { Router } from "express";
import db from "@/config/db/index.ts";
import { and, eq, inArray, or } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
const TARGET_COURSES = [
    "phd seminar",
    "phd thesis",
    "practice lecture series 1",
];

const router = Router();

router.get(
    "/",
    checkAccess("grades:supervisor:view"),
    asyncHandler(async (req, res, next) => {
        const userEmail = req.user?.email;
        if (!userEmail) {
            return next(new HttpError(HttpCode.UNAUTHORIZED, "Unauthenticated"));
        }

        const erpIdsParam = req.query.erpIds;
        let erpIds: string[] | null = null;
        if (Array.isArray(erpIdsParam)) {
            erpIds = erpIdsParam.filter(Boolean) as string[];
        } else if (typeof erpIdsParam === "string") {
            erpIds = erpIdsParam.split(",").map((s) => s.trim()).filter(Boolean);
        }

        // Get students assigned to this user as supervisor (only those with actual supervisor assignments)
        const supervisorStudents = await db.query.phd.findMany({
            where: (phd) =>
                erpIds && erpIds.length > 0
                    ? and(eq(phd.supervisorEmail, userEmail), inArray(phd.erpId, erpIds))
                    : eq(phd.supervisorEmail, userEmail),
            columns: { email: true, name: true, erpId: true, idNumber: true },
        });

        // Get students assigned to this user as instructor
        const instructorAssignmentsRaw = await db.query.instructorSupervisorGrades.findMany({
            where: (t) => and(
                eq(t.instructorSupervisorEmail, userEmail),
                eq(t.role, 'instructor')
            ),
        });

        // Get instructor details for all assignments
        const instructorEmails = [...new Set(instructorAssignmentsRaw.map(a => a.instructorSupervisorEmail))];
        const instructors = instructorEmails.length
            ? await db.query.faculty.findMany({
                where: (f) => inArray(f.email, instructorEmails),
                columns: { email: true, name: true },
            })
            : [];

        const instructorMap = new Map(instructors.map(i => [i.email, i.name]));

        // Create instructor assignments with names
        const instructorAssignments = instructorAssignmentsRaw.map(assignment => ({
            studentErpId: assignment.studentErpId,
            courseName: assignment.courseName,
            instructorEmail: assignment.instructorSupervisorEmail,
            instructorName: instructorMap.get(assignment.instructorSupervisorEmail) || assignment.instructorSupervisorEmail,
        }));

        const instructorStudentErpIds = instructorAssignmentsRaw.map(a => a.studentErpId);

        const instructorStudents = instructorStudentErpIds.length
            ? await db.query.phd.findMany({
                where: (phd) => inArray(phd.erpId, instructorStudentErpIds),
                columns: { email: true, name: true, erpId: true, idNumber: true },
            })
            : [];

        if (instructorAssignmentsRaw.length > 0 && instructorStudents.length === 0) {
            const instructorStudentsFromAssignments = instructorAssignmentsRaw.map(assignment => ({
                email: `student_${assignment.studentErpId}@example.com`,
                name: assignment.studentName || `Student ${assignment.studentErpId}`,
                erpId: assignment.studentErpId,
                idNumber: assignment.studentErpId,
                campusId: assignment.campusId,
            }));
            instructorStudents.push(...instructorStudentsFromAssignments);
        }

        const allStudents = [...supervisorStudents];
        instructorStudents.forEach(instructorStudent => {
            if (!allStudents.find(s => s.erpId === instructorStudent.erpId)) {
                allStudents.push(instructorStudent);
            }
        });

        const allStudentErpIds = allStudents.map((s) => s.erpId).filter((id): id is string => Boolean(id));

        const allGrades = allStudentErpIds.length
            ? await db.query.instructorSupervisorGrades.findMany({
                where: (t) => and(
                    inArray(t.studentErpId, allStudentErpIds),
                    or(
                        eq(t.role, 'supervisor'),
                        eq(t.role, 'instructor')
                    )
                ),
            })
            : [];

        const allCourses = [...new Set(allGrades.map(g => g.courseName))];

        res.json({
            success: true,
            data: {
                students: allStudents,
                grades: allGrades,
                targetCourses: TARGET_COURSES,
                courses: allCourses,
                instructorAssignments: instructorAssignments
            }
        });
    })
);

export default router;