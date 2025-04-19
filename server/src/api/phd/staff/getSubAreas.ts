import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSubAreas } from "@/config/db/schema/phd.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const subAreas = await db.select().from(phdSubAreas);
        res.status(200).json({ success: true, subAreas });
    })
);

export default router;
