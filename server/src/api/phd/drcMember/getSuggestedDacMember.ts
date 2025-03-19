import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdConfig } from "@/config/db/schema/phd.ts";
import { sql, and, isNotNull, gte } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess("drc-view-dac-students"),
    asyncHandler(async (_req, res) => {
        const proposalDeadlineRow = await db
            .select({ value: phdConfig.value })
            .from(phdConfig)
            .where(sql`${phdConfig.key} = 'proposal_request_deadline'`)
            .limit(1);

        if (proposalDeadlineRow.length === 0) {
            res.status(500).json({ success: false, message: "Proposal deadline not set" });
            return;
        }

        const proposalDeadline = new Date(proposalDeadlineRow[0].value);

        const students = await db
            .select({
                email: phd.email,
                name: phd.name,
                suggestedDacMembers: phd.suggestedDacMembers,
            })
            .from(phd)
            .where(and(isNotNull(phd.suggestedDacMembers), gte(phd.qualificationDate, proposalDeadline)));

        res.status(200).json({ success: true, students });
    })
);

export default router;
