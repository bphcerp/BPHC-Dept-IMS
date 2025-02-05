import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { asc, isNull } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess("drc-view-phd"),
    asyncHandler(async (_req, res) => {
        const phdRecords = await db
            .select()
            .from(phd)
            .orderBy(
                isNull(phd.qualifyingExam1Date),
                isNull(phd.qualifyingExam2Date),
                asc(phd.qualifyingExam1Date),
                asc(phd.qualifyingExam2Date)
            );

        res.json({ success: true, phdRecords });
    })
);

export default router;
