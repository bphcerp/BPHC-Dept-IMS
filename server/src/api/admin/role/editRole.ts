import express from "express";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import db from "@/config/db";
import { users } from "@/config/db/schema/admin";
import { eq } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors";
import { asyncHandler } from "@/middleware/routeHandler";
import { checkAccess } from "@/middleware/auth";
const router = express.Router();

// Define the request body schema for updating roles
const updateRoleBodySchema = z.object({
    email: z.string().email(),
    role: z.string(),
});

// PUT /update-role
// validate the request body (email and role)
// checks for an existing user
// if user exists, updates their roles
// returns an error if the user doesn't exist
router.put(
    "/",
    checkAccess("role:edit"),
    asyncHandler(async (req, res, next) => {
        const parseResult = updateRoleBodySchema.safeParse(req.body);
        if (!parseResult.success) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Invalid request body",
                    fromError(parseResult.error).toString()
                )
            );
        }

        const { email, role } = parseResult.data;

        try {
            // Check if the user exists
            const existingUser = await db.query.users.findFirst({
                where: eq(users.email, email),
            });

            if (!existingUser) {
                return next(new HttpError(HttpCode.NOT_FOUND, "User not found"));
            }

            // Update the user's roles
            await db.update(users).set({ roles: [role] }).where(eq(users.email, email));

            res.status(200).json({ message: "User role updated successfully" });
        } catch (error) {
            console.error("Error occurred:", error);

            if (error instanceof HttpError) {
                return next(error);
            }

            return next(
                new HttpError(
                    HttpCode.INTERNAL_SERVER_ERROR,
                    "Failed to update user role"
                )
            );
        }
    })
);

export default router;
