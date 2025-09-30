import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const phdData = await db.select().from(phd);
        res.status(200).json(phdData);
    })
);

export default router;
