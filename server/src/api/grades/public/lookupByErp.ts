import { Router } from "express";
import db from "@/config/db/index.ts";
import { inArray } from "drizzle-orm";
import { asyncHandler } from "@/middleware/routeHandler.ts";

const router = Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const erpIdsParam = req.query.erpIds;
        let erpIds: string[] = [];
        if (typeof erpIdsParam === "string") erpIds = erpIdsParam.split(",").map((s) => s.trim()).filter(Boolean);
        if (Array.isArray(erpIdsParam)) erpIds = erpIdsParam as string[];
        if (erpIds.length === 0) { res.json({ success: true, data: [] }); return; }

        const students = await db.query.phd.findMany({
            where: (phd) => inArray(phd.erpId, erpIds),
            columns: { email: true, erpId: true, supervisorEmail: true },
        });

        const studentErpIds = students.map((s) => s.erpId).filter((id): id is string => Boolean(id));
        const gradesRaw = studentErpIds.length
            ? await db.query.instructorSupervisorGrades.findMany({
                where: (t) => inArray(t.studentErpId, studentErpIds),
            })
            : [];

        const grades = gradesRaw.map(grade => {
            const student = students.find(s => s.erpId === grade.studentErpId);
            return {
                studentEmail: student?.email || `student_${grade.studentErpId}@example.com`,
                courseName: grade.courseName,
                midsemGrade: grade.midsemGrade,
                compreGrade: grade.compreGrade,
                midsemMarks: grade.midsemMarks,
                endsemMarks: grade.endsemMarks,
                midsemDocFileId: grade.midsemDocFileId,
                endsemDocFileId: grade.endsemDocFileId,
            };
        });

        res.json({ success: true, data: { students, grades } });
    })
);

export default router;