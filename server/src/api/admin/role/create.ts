import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { roles } from "@/config/db/schema/admin.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { adminSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess("admin:role:create"),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const parsed = adminSchemas.roleCreateBodySchema.parse(req.body);
        const insertedRoles = await db
            .insert(roles)
            .values({
                roleName: parsed.name,
            })
            .onConflictDoNothing()
            .returning();

        if (insertedRoles.length === 0) {
            return next(
                new HttpError(HttpCode.CONFLICT, "Role already exists")
            );
        }

        res.json({ success: true });
    })
);

export default router;
