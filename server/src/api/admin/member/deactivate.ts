import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { users } from "@/config/db/schema/admin.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { adminSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess("admin"),
    asyncHandler(async (req, res, next) => {
        const parsed = adminSchemas.deactivateMemberBodySchema.parse(req.body);

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
