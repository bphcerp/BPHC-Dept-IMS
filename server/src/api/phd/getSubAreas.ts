import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import db from "@/config/db/index.ts";

const router = express.Router();

router.get(
    "/", // public route
    asyncHandler(async (_req, res) => {
        const subAreas = await db.query.phdSubAreas.findMany();
        res.status(200).json({
            subAreas: subAreas.map((area) => area.subArea),
        });
    })
);

export default router;
