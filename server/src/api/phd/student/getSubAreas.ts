import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const subAreas = await db.query.phdSubAreas.findMany();
        res.status(200).json({
            subAreas: subAreas.map((area) => ({
                subAreaName: area.subArea,
            })),
        });
    })
);

export default router;
