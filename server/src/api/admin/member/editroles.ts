import express from "express";
import { z } from "zod";
import db from "@/config/db/index.ts";
import { users } from "@/config/db/schema/admin.ts";
import { eq, sql } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

const editRolesBodySchema = z
    .object({
        email: z.string().email(),
        add: z.string().trim().nonempty().optional(),
        remove: z.string().trim().nonempty().optional(),
    })
    .refine(
        (data) => !!data.add !== !!data.remove,
        "Specify either add or remove"
    );

router.post(
    "/",
    checkAccess("admin"),
    asyncHandler(async (req, res, next) => {
        const parsed = editRolesBodySchema.parse(req.body);
        if (!parsed.add?.length && !parsed.remove?.length) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "No roles to add or remove")
            );
        }
        // Check if the user exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, parsed.email),
        });
        if (!existingUser) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "User not found"));
        }
        // Update the user's roles
        try {
            await db
                .update(users)
                .set({
                    roles: parsed.add?.length
                        ? sql`array_append(array_remove(${users.roles}, ${parsed.add}), ${parsed.add})` // Removing first ensures no duplicates
                        : sql`array_remove(${users.roles}, ${parsed.remove})`,
                })
                .where(eq(users.email, parsed.email))
                .returning();
        } catch (e) {
            if ((e as Error)?.message === "Role does not exist in roles table")
                return next(
                    new HttpError(
                        HttpCode.BAD_REQUEST,
                        "Role does not exist in roles table"
                    )
                );
            throw e;
        }
        res.status(200).json({ success: true });
    })
);

export default router;
