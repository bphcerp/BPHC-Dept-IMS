import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { roles, permissions } from "@/config/db/schema/admin.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { eq } from "drizzle-orm";
import { adminSchemas } from "lib";

const router = express.Router();

router.post(
    "/:role",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const parsedPath = adminSchemas.roleEditPathSchema.parse(req.params);
        const parsedBody = adminSchemas.roleEditBodySchema.parse(req.body);

        const role = await db.query.roles.findFirst({
            where: eq(roles.roleName, parsedPath.role),
        });
        if (!role) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    `Role '${parsedPath.role}' not found`
                )
            );
        }

        if (parsedBody.permission) {
            const permission = await db.query.permissions.findFirst({
                where: eq(permissions.permission, parsedBody.permission),
            });
            if (!permission) {
                return next(
                    new HttpError(
                        HttpCode.NOT_FOUND,
                        `Permission '${parsedBody.permission}' not found`
                    )
                );
            }
        }

        // Check if permission is already in allowed or disallowed list, and handle accordingly
        const allowed = role.allowed.includes(parsedBody.permission);
        const disallowed = role.disallowed.includes(parsedBody.permission);
        if (allowed && parsedBody.action === "allow") {
            return next(
                new HttpError(
                    HttpCode.NOT_MODIFIED,
                    `Permission '${parsedBody.permission}' already allowed`
                )
            );
        }
        if (disallowed && parsedBody.action === "disallow") {
            return next(
                new HttpError(
                    HttpCode.NOT_MODIFIED,
                    `Permission '${parsedBody.permission}' already disallowed`
                )
            );
        }

        const newAllowed = role.allowed.filter(
            (permission) => permission !== parsedBody.permission
        );
        const newDisallowed = role.disallowed.filter(
            (permission) => permission !== parsedBody.permission
        );
        if (parsedBody.action === "allow") {
            newAllowed.push(parsedBody.permission);
        }
        if (parsedBody.action === "disallow") {
            newDisallowed.push(parsedBody.permission);
        }

        await db
            .update(roles)
            .set({
                allowed: newAllowed,
                disallowed: newDisallowed,
            })
            .where(eq(roles.roleName, parsedPath.role))
            .execute();

        res.json({ success: true });
    })
);

export default router;
