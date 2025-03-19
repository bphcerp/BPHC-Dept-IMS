import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdDocuments, phdConfig } from "@/config/db/schema/phd.ts";
import { eq, sql, desc } from "drizzle-orm";

const router = express.Router();

export default router.get(
    "/",
    checkAccess("drc-view-qualifying-exam-applications"),
    asyncHandler(async (_req, _res, next) => {
        // Get the latest qualifying exam deadline
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
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "No deadline found")
            );
        }
        console.log("deadline",latestDeadline );
        // const { value: deadlineValue, createdAt: deadlineCreatedAt } = latestDeadline[0];

        // Get all students who have submitted qualifying exam applications within the deadline window
        const students = await db
            .select({
                name: phd.name,
                email: phd.email,
                erpId: phd.erpId,
                fileUrl: phdDocuments.fileUrl,
                formName: phdDocuments.formName,
                uploadedAt: phdDocuments.uploadedAt,
            })
            .from(phd)
            .innerJoin(phdDocuments, eq(phd.email, phdDocuments.email))
            .where(
                sql`TRIM(BOTH '"' FROM ${phdDocuments.applicationType}) = 'qualifying_exam'`
                
            )
            .orderBy(desc(phdDocuments.uploadedAt));

        console.log("student", students);

        if (!students.length) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    "No qualifying exam applications found"
                )
            );
        }

        _res.json({ success: true, applications: students });
    })
);
