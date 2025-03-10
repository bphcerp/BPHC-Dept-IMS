import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { sql } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess("drc-get-qualifying-students"),
    asyncHandler(async (_req, res) => {
        const students = await db
            .select({
                name: phd.name,
                email: phd.email,
                area1: phd.qualifyingArea1,
                area2: phd.qualifyingArea2
            })
            .from(phd)
            .where(
                sql`${phd.qualifyingArea1} IS NOT NULL AND ${phd.qualifyingArea2} IS NOT NULL`
            );

        res.status(200).json({ success: true, students });
    })
);

export default router;
