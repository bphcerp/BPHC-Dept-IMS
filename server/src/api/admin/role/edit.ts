import { asyncHandler } from "@/middleware/routeHandler";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth";
import z from "zod";
import db from "@/config/db";
import { roles, permissions } from "@/config/db/schema/admin";
import { HttpCode, HttpError } from "@/config/errors";
import { eq } from "drizzle-orm";

const router = express.Router();

const pathSchema = z.object({
    role: z
        .string()
        .trim()
        .nonempty()
        .regex(/^[a-z0-9-]+$/)
        .max(128),
});

// Action can be either "allow", "disallow" or "none"
const bodySchema = z.object({
    permission: z
        .string()
        .trim()
        .nonempty()
        .regex(/^[a-z0-9-:]+$/),
    action: z.enum(["allow", "disallow", "none"]),
});

router.post(
    "/",
    checkAccess("role:edit"),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const parsedPath = pathSchema.parse(req.params);
        const parsedBody = bodySchema.parse(req.body);

        const role = await db.query.roles.findFirst({
            where: eq(roles.role, parsedPath.role),
        });
        if (!role) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    `Role '${parsedPath.role}' not found`
                )
            );
        }

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
            .where(eq(roles.role, parsedPath.role))
            .execute();

        res.json({ success: true });
    })
);

export default router;
