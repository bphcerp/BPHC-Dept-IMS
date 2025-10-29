import db from "@/config/db/index.ts";
import { allocationSection } from "@/config/db/schema/allocation.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import express from "express";
import { allocationSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    asyncHandler(async (req, res) => {
        const { sectionId, roomId } =
            allocationSchemas.setSectionRoomBodySchema.parse(req.body);

        await db
            .update(allocationSection)
            .set({
                timetableRoomId: roomId,
            })
            .where(eq(allocationSection.id, sectionId));

        res.status(200).send();
    })
);

export default router;
