import { asyncHandler } from "@/middleware/routeHandler";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth";
import { permissions } from "@/config/db/schema/admin";
import db from "@/config/db";
const router = express.Router();

router.get(
    "/",
    checkAccess("permissions:read"),
    asyncHandler(async (req, res, _) => {
        assert(req.user);
        const allPermissions = await db.select().from(permissions).execute();
        res.json(allPermissions);
    })
);

export default router;
