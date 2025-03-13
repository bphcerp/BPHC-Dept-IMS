import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { roles } from "@/config/db/schema/admin.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { eq } from "drizzle-orm";
import { adminSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const parsed = adminSchemas.roleDeleteBodySchema.parse(req.body);
        const deletedRoles = await db
            .delete(roles)
            .where(eq(roles.roleName, parsed.role))
            .returning();

        if (deletedRoles.length === 0) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    `Role '${parsed.role}' not found`
                )
            );
        }

        res.json({ success: true });
    })
);

export default router;
