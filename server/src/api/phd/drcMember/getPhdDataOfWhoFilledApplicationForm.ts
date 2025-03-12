import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdDocuments, phdConfig } from "@/config/db/schema/phd.ts";
import { eq, sql, desc } from "drizzle-orm";

const router = express.Router();

export default router.get(
    "/",
    checkAccess("drc-view-qualifying-exam-applications"),
    asyncHandler(async (_req, res) => {
        
        const latestDeadline = await db
            .select({
                value: phdConfig.value, 
                createdAt: phdConfig.createdAt, 
            })
            .from(phdConfig)
            .where(eq(phdConfig.key, "qualifying_exam_deadline"))
            .orderBy(desc(phdConfig.createdAt))
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
                erpId: phd.erpId,
                fileUrl: phdDocuments.fileUrl,
                formName: phdDocuments.formName,
            })
            .from(phd)
            .innerJoin(
                phdDocuments,
                eq(phd.email, phdDocuments.email) 
            )
            .where(
                sql`${phd.qualifyingAreasUpdatedAt} >= ${deadlineCreatedAt} 
                     AND ${phd.qualifyingAreasUpdatedAt} <= ${deadlineValue}
                     AND ${phdDocuments.applicationType} = 'qualifying_exam'`
            )
            .orderBy(desc(phdDocuments.uploadedAt)) 
            .limit(1); 

        if (!students.length) {
             res.status(404).json({
                success: false,
                message: "No qualifying exam applications found",
            });
            return;
        }

        res.status(200).json({ success: true, applications: students });
    })
);
