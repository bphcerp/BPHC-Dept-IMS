import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdConfig } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import { phdSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess("drc-update-deadline"),
    asyncHandler(async (req, res) => {
        const parsed = phdSchemas.updateQualifyingDeadlineBodySchema.parse(req.body);

        const existingRecord = await db.select()
        .from(phdConfig)
        .where(eq(phdConfig.key, "qualifying_exam_deadline"))
        .limit(1);

        if (existingRecord.length > 0) {
            await db.update(phdConfig)
            .set({ value: new Date(parsed.deadline) })
            .where(eq(phdConfig.key, "qualifying_exam_deadline"));
        } else {
            await db.insert(phdConfig)
            .values({
                key: "qualifying_exam_deadline",
                value: new Date(parsed.deadline)
            });
        }

        res.status(200).json({ success: true });
    })
);

export default router;
