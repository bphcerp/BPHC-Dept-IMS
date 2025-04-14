import express from "express";
import { runPublicationSync } from "../../../scripts/publications.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";

const router = express.Router();

// POST /api/sync-publications
router.post(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        try {
            await runPublicationSync();
            res.status(200).json({
                success: true,
                message: "Publications sync completed.",
            });
        } catch (error) {
            console.error("Sync error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to sync publications.",
            });
        }
    })
);

export default router;
