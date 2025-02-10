import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { roles } from "@/config/db/schema/admin.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { adminSchemas } from "lib";
import { eq } from "drizzle-orm";

const router = express.Router();

router.post(
    "/",
    checkAccess("admin"),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const parsed = adminSchemas.renameRoleBodySchema.parse(req.body);
        try {
            const updatedRole = await db
                .update(roles)
                .set({
                    roleName: parsed.newName,
                })
                .where(eq(roles.roleName, parsed.oldName))
                .returning();
            if (updatedRole.length === 0) {
                return next(
                    new HttpError(HttpCode.NOT_FOUND, "Role not found")
                );
            }
        } catch (e) {
            if ((e as { code: string })?.code === "23505")
                return next(
                    new HttpError(
                        HttpCode.CONFLICT,
                        "A role with that name already exists"
                    )
                );
        }

        res.json({ success: true });
    })
);

export default router;
