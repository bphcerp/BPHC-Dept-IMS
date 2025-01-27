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
const bodySchema = z.object({
    role: z.string().trim().nonempty().max(48),
});
router.post(
    "/",
    checkAccess("role:delete"),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const parsed = bodySchema.parse(req.body);
        const deletedRoles = await db
            .delete(roles)
            .where(eq(roles.role, parsed.role))
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
