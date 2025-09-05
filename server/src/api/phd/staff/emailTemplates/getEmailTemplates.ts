import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import db from "@/config/db/index.ts";

const router = express.Router();

// GET all email templates
router.get(
    "/",
    asyncHandler(async (_req, res) => {
        const templates = await db.query.phdEmailTemplates.findMany();
        res.status(200).json(templates);
    })
);

export default router;
