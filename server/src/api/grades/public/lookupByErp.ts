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

        const emails = students.map((s) => s.email);
        const grades = emails.length
            ? await db.query.phdSupervisorGrades.findMany({
                where: (t) => inArray(t.studentEmail, emails),
            })
            : [];

        res.json({ success: true, data: { students, grades } });
    })
);

export default router;



