import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdConfig } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

export default router.get(
    "/",
    checkAccess("pd-view-proposal-deadline"),
    asyncHandler(async (_req, res) => {
        const deadlineEntry = await db
            .select({ deadline: phdConfig.value })
            .from(phdConfig)
            .where(eq(phdConfig.key, "proposal_request_deadline"))
            .limit(1);

        if (deadlineEntry.length === 0) {
            res.status(404).json({ success: false, message: "Proposal request deadline not set" });
            return;
        }

        res.status(200).json({ success: true, deadline: deadlineEntry[0].deadline });
    })
);
