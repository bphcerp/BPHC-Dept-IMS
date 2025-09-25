import db from "@/config/db/index.ts";
import { allocationSection } from "@/config/db/schema/allocation.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq, inArray } from "drizzle-orm";
import express from "express";
import { allocationSchemas } from "lib";

const router = express.Router();

router.delete(
    "/",
    asyncHandler(async (req, res, _next) => {
        const { sectionId } = allocationSchemas.removeSectionsBodySchema.parse(
            req.body
        );

        await db
            .delete(allocationSection)
            .where(
                Array.isArray(sectionId)
                    ? inArray(allocationSection.id, sectionId)
                    : eq(allocationSection.id, sectionId)
            );

        res.status(204).send();
    })
);

export default router;
