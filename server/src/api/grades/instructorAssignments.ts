import { Router } from "express";
import db from "@/config/db/index.ts";
import { and, eq, inArray } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";

const router = Router();

router.get(
    "/",
    checkAccess("grades:assign"),
    asyncHandler(async (req, res) => {
        const erpIdsParam = req.query.erpIds;
        const courseNamesParam = req.query.courseNames;

        let erpIds: string[] = [];
        let courseNames: string[] = [];

        if (typeof erpIdsParam === "string") erpIds = erpIdsParam.split(",").map((s) => s.trim()).filter(Boolean);
        if (Array.isArray(erpIdsParam)) erpIds = erpIdsParam as string[];

        if (typeof courseNamesParam === "string") courseNames = courseNamesParam.split(",").map((s) => s.trim()).filter(Boolean);
        if (Array.isArray(courseNamesParam)) courseNames = courseNamesParam as string[];

        if (erpIds.length === 0 || courseNames.length === 0) {
            res.json({ success: true, data: [] });
            return;
        }

        const assignments = await db.query.instructorSupervisorGrades.findMany({
            where: (t) => and(
                inArray(t.studentErpId, erpIds),
                inArray(t.courseName, courseNames),
                eq(t.role, 'instructor')
            ),
        });

        const instructorEmails = [...new Set(assignments.map(a => a.instructorSupervisorEmail))];
        const instructors = instructorEmails.length
            ? await db.query.faculty.findMany({
                where: (f) => inArray(f.email, instructorEmails),
                columns: { email: true, name: true },
            })
            : [];

        const instructorMap = new Map(instructors.map(i => [i.email, i.name]));

        const result = assignments.map(assignment => ({
            studentErpId: assignment.studentErpId,
            courseName: assignment.courseName,
            instructorEmail: assignment.instructorSupervisorEmail,
            instructorName: instructorMap.get(assignment.instructorSupervisorEmail) || assignment.instructorSupervisorEmail,
            phase: assignment.phase,
        }));

        res.json({ success: true, data: result });
    })
);

export default router;
