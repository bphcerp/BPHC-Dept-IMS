import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdSchemas } from "lib";
import { sql } from "drizzle-orm";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = phdSchemas.updateQualifyingExamStatusSchema.parse(
            req.body
        );

        const updates = Object.entries(parsed);
        for (const [email, result] of updates) {
            const student = await db
                .select()
                .from(phd)
                .where(sql`${phd.email} = ${email}`)
                .limit(1);

            if (!student.length) continue;

            const passed = result === "pass";
            let updateData: Record<string, boolean> = {};

            if (student[0].numberOfQeApplication === 1) {
                updateData = { qualifyingExam1: passed };
            } else if (student[0].numberOfQeApplication === 2) {
                updateData = { qualifyingExam2: passed };
            } else {
                continue;
            }

            await db
                .update(phd)
                .set(updateData)
                .where(sql`${phd.email} = ${email}`);
        }

        res.status(200).json({
            success: true,
            message: "Qualifying exam statuses updated successfully",
        });
    })
);

export default router;
