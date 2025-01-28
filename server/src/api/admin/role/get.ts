import { asyncHandler } from "@/middleware/routeHandler";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth";
import z from "zod";
import db from "@/config/db";
import { roles } from "@/config/db/schema/admin";
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

router.get(
    "/:role",
    checkAccess("role:read"),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const parsed = pathSchema.parse(req.params);
        const role = await db
            .select()
            .from(roles)
            .where(eq(roles.role, parsed.role))
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
