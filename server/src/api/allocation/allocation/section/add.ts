import db from "@/config/db/index.ts";
import { allocationSection } from "@/config/db/schema/allocation.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { allocationSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    asyncHandler(async (req, res, _next) => {
        const { masterId, sectionType } =
            allocationSchemas.addSectionBodySchema.parse(req.body);

        await db.insert(allocationSection).values({
            masterId,
            type: sectionType,
        });

        res.status(200).send();
    })
);

export default router;
