import express from "express";
import { z } from "zod";
import db from "@/config/db";
import { asyncHandler } from "@/middleware/routeHandler";
import { eq } from "drizzle-orm";
import { users } from "@/config/db/schema/admin";
import { HttpCode, HttpError } from "@/config/errors";
import { checkAccess } from "@/middleware/auth";

const router = express.Router();

const deactivateSchema = z.object({
    email: z.string().email(),
});

router.post(
    "/",
    checkAccess("member:deactivate"),
    asyncHandler(async (req, res, next) => {
        const parsed = deactivateSchema.parse(req.body);

        // Checking if user exists before deactivating

        const userExists = await db.query.users.findFirst({
            where: eq(users.email, parsed.email),
        });

        if (!userExists) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "User does not exist")
            );
        }

        // Deactivting user and emptying roles

        await db
            .update(users)
            .set({ deactivated: true, roles: [] })
            .where(eq(users.email, parsed.email));

        res.status(200).json({ status: "success" });
    })
);

export default router;
