import db from "@/config/db/index.ts";
import { staff } from "@/config/db/schema/admin.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const staffData = await db.select().from(staff);
        res.status(200).json(staffData);
    })
);

export default router;
