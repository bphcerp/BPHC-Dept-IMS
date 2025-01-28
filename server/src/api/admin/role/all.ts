import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth.ts";
import { roles } from "@/config/db/schema/admin.ts";
import db from "@/config/db/index.ts";
const router = express.Router();

router.get(
    "/",
    checkAccess("role:read"),
    asyncHandler(async (req, res, _) => {
        assert(req.user);

        const allRoles = await db
            .select({
                role: roles.role,
            })
            .from(roles)
            .execute();
        res.json(allRoles.map((role) => role.role));
    })
);

export default router;
