import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { sql } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const students = await db
            .select({
                email: phd.email,
                name: phd.name,
                suggestedDacMembers: phd.suggestedDacMembers
            })
            .from(phd)
            .where(sql`phd.suggested_dac_members IS NOT NULL AND array_length(phd.suggested_dac_members, 1) > 0`);

        res.json({
            success: true,
            students
        });
    })
);


export default router;
