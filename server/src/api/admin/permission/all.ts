import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth.ts";
import { permissions } from "@/config/db/schema/admin.ts";
import db from "@/config/db/index.ts";
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
