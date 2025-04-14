import express from "express";
import { runPublicationSync } from "../../../scripts/publications.ts";

const router = express.Router();

// POST /api/sync-publications
router.post("/", async (req, res) => {
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
});

export default router;
