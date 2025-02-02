import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth.ts";
import z from "zod";
import db from "@/config/db/index.ts";
import { roles } from "@/config/db/schema/admin.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

// Check if role name is in kebab case
const bodySchema = z.object({
    name: z
        .string()
        .trim()
        .nonempty()
        .regex(/^[a-z0-9-]+$/)
        .max(128),
});

router.post(
    "/",
    checkAccess("role:create"),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const parsed = bodySchema.parse(req.body);
        const insertedRoles = await db
            .insert(roles)
            .values({
                role: parsed.name,
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
