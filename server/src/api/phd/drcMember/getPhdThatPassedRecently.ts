import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdConfig } from "@/config/db/schema/phd.ts";
import { sql } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess("drc-view-passed-students"),
    asyncHandler(async (_req, res) => {
        const deadlineEntry = await db
            .select({ deadline: phdConfig.value })
            .from(phdConfig)
            .where(sql`${phdConfig.key} = 'qualifying_exam_deadline'`)
            .limit(1);

        if (!deadlineEntry.length) {
            res.status(400).json({
                success: false,
                message: "Qualifying exam deadline not set",
            });
            return;
        }

        const deadlineDate = new Date(deadlineEntry[0].deadline);
        if (isNaN(deadlineDate.getTime())) {
            res.status(500).json({
                success: false,
                message: "Invalid deadline date in database",
            });
            return;
        }

        const currentDate = new Date();

        const passedStudents = await db
            .select({
                email: phd.email,
                name: phd.name,
                qualifyingExam1: phd.qualifyingExam1,
                qualifyingExam2: phd.qualifyingExam2,
                qualifyingExam1Date: phd.qualifyingExam1Date,
                qualifyingExam2Date: phd.qualifyingExam2Date,
            })
            .from(phd)
            // .where(
            //     sql`(
            //         (${phd.qualifyingExam1} = true AND ${phd.qualifyingExam1Date} BETWEEN ${deadlineDate} AND ${currentDate})
            //         OR
            //         (${phd.qualifyingExam2} = true AND ${phd.qualifyingExam2Date} BETWEEN ${deadlineDate} AND ${currentDate})
            //     )`
            // );
            .where(
                sql`(
                    (${phd.qualifyingExam1} = true)
                    OR
                    (${phd.qualifyingExam2} = true)
                )`
            );

        res.status(200).json({ success: true, students: passedStudents });
    })
);

export default router;
