import { Router } from "express";
import db from "@/config/db/index.ts";
import { and, eq, inArray } from "drizzle-orm";
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
        const supervisorEmail = req.user?.email;
        if (!supervisorEmail) {
            return next(new HttpError(HttpCode.UNAUTHORIZED, "Unauthenticated"));
        }

        const erpIdsParam = req.query.erpIds;
        let erpIds: string[] | null = null;
        if (Array.isArray(erpIdsParam)) {
            erpIds = erpIdsParam.filter(Boolean) as string[];
        } else if (typeof erpIdsParam === "string") {
            erpIds = erpIdsParam.split(",").map((s) => s.trim()).filter(Boolean);
        }

        const students = await db.query.phd.findMany({
            where: (phd) =>
                erpIds && erpIds.length > 0
                    ? and(eq(phd.supervisorEmail, supervisorEmail), inArray(phd.erpId, erpIds))
                    : eq(phd.supervisorEmail, supervisorEmail),
            columns: { email: true, name: true, erpId: true, idNumber: true },
        });

        const studentEmails = students.map((s) => s.email);
        const grades = studentEmails.length
            ? await db.query.phdSupervisorGrades.findMany({
                where: (t) => and(inArray(t.studentEmail, studentEmails), inArray(t.courseName, TARGET_COURSES)),
            })
            : [];

        res.json({ success: true, data: { students, grades, targetCourses: TARGET_COURSES } });
    })
);

export default router;


