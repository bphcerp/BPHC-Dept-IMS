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

router.get(
    "/:role",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const parsed = adminSchemas.roleGetPathSchema.parse(req.params);
        const role = await db
            .select()
            .from(roles)
            .where(eq(roles.roleName, parsed.role))
            .limit(1)
            .execute();

        if (role.length === 0) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    `Role '${parsed.role}' not found`
                )
            );
        }

        res.json(role[0]);
    })
);

export default router;
