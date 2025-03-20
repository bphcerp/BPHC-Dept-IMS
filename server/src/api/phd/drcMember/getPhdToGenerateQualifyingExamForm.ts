import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdConfig } from "@/config/db/schema/phd.ts";
import { sql, eq } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        // Get latest deadline
        const latestDeadline = await db
            .select({
                value: phdConfig.value, 
                createdAt: phdConfig.createdAt, 
            })
            .from(phdConfig)
            .where(eq(phdConfig.key, "qualifying_exam_deadline"))
            .orderBy(sql`${phdConfig.createdAt} DESC`)
            .limit(1);

        if (!latestDeadline.length) {
             res.status(400).json({ success: false, message: "No deadline found" });
             return;
        }

        const { value: deadlineValue, createdAt: deadlineCreatedAt } = latestDeadline[0];
       
        const students = await db
            .select({
                name: phd.name,
                email: phd.email,
                area1: phd.qualifyingArea1,
                area2: phd.qualifyingArea2,
                idNumber: phd.idNumber,
                examAttempt: phd.numberOfQeApplication,
            })
            .from(phd)
            .where(
                sql`${phd.qualifyingAreasUpdatedAt} >= ${deadlineCreatedAt} 
                     AND ${phd.qualifyingAreasUpdatedAt} <= ${deadlineValue}`
            );
        res.status(200).json({ success: true, students });
    })
);


export default router;
