import { Router } from "express";
import db from "@/config/db/index.ts";
import { inArray } from "drizzle-orm";
import { asyncHandler } from "@/middleware/routeHandler.ts";

const router = Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const erpIdsParam = req.query.erpIds;
        const courseNamesParam = req.query.courseNames;

        let erpIds: string[] = [];
        let courseNames: string[] = [];

        if (typeof erpIdsParam === "string")
            erpIds = erpIdsParam
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        if (Array.isArray(erpIdsParam)) erpIds = erpIdsParam as string[];

        if (typeof courseNamesParam === "string")
            courseNames = courseNamesParam
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        if (Array.isArray(courseNamesParam))
            courseNames = courseNamesParam as string[];

        const savedGrades =
            erpIds.length && courseNames.length
                ? await db.query.instructorSupervisorGrades.findMany({
                      where: (t) =>
                          inArray(t.studentErpId, erpIds) &&
                          inArray(t.courseName, courseNames),
                  })
                : [];

        const gradesMap: Record<string, any> = {};
        savedGrades.forEach((grade) => {
            const key = `${grade.studentErpId}::${grade.courseName}`;
            gradesMap[key] = {
                studentErpId: grade.studentErpId,
                courseName: grade.courseName,
                role: grade.role,
                midsemGrade: grade.midsemGrade,
                compreGrade: grade.compreGrade,
                midsemMarks: grade.midsemMarks,
                endsemMarks: grade.endsemMarks,
                topic: grade.topic,
                midsemDocFileId: grade.midsemDocFileId,
                endsemDocFileId: grade.endsemDocFileId,
                instructorSupervisorEmail: grade.instructorSupervisorEmail,
            };
        });

        res.json({
            success: true,
            data: {
                gradesMap,
                totalGrades: savedGrades.length,
            },
        });
    })
);

export default router;
