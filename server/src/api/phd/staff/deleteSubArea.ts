import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSubAreas } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import { phdSchemas } from "lib";

const router = express.Router();

router.delete(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const subArea = phdSchemas.updateSubAreasSchema.parse(req.body);
        await db
            .delete(phdSubAreas)
            .where(eq(phdSubAreas.subArea, subArea.subArea));
        res.status(200).send();
    })
);

export default router;
