import { db } from "@/config/db/index.ts"; 
import { users } from "@/config/db/schema/patents.ts"; 
import express from "express";
import { updateInventorEmailSchema } from "@/validations/inventorSchemas.ts"; 
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

router.patch(
    "/saveInventorEmail",
    asyncHandler(async (req, res, next) => {
        // Validate request body with Zod
        const validation = updateInventorEmailSchema.safeParse(req.body);
        if (!validation.success) {
            return next(new HttpError(HttpCode.BAD_REQUEST, validation.error.errors[0].message));
        }

        const { inventorName, newEmail } = validation.data;

        try {
            // 1) Check if the user already exists
            const existingUser = await db.query.users.findFirst({
                where: (user, { eq }) => eq(user.name, inventorName.trim()),
            });

            let user;

            if (!existingUser) {
                // 2) If user doesn't exist, create one
                const [newUser] = await db
                    .insert(users)
                    .values({ name: inventorName.trim(), email: newEmail.trim() })
                    .returning();

                user = newUser;
            } else {
                // 3) If user exists, update their email
                const [updatedUser] = await db
                    .update(users)
                    .set({ email: newEmail.trim() })
                    .where((user, { eq }) => eq(user.id, existingUser.id))
                    .returning();

                user = updatedUser;
            }

            return res.status(200).json({ success: true, user });
        } catch (err) {
            console.error("Error in /saveInventorEmail route:", err);
            return next(new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    })
);

export default router;
