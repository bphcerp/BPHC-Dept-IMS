// server/src/api/phd/proposal/supervisor/getAvailableSlots.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSeminarSlots } from "@/config/db/schema/phd.ts";
import { eq, desc } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const availableSlots = await db.query.phdSeminarSlots.findMany({
            where: eq(phdSeminarSlots.isBooked, false),
            orderBy: desc(phdSeminarSlots.startTime),
        });
        res.status(200).json(availableSlots);
    })
);

export default router;
