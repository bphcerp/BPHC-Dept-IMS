import { asyncHandler } from "@/middleware/routeHandler";
import express from "express";
import db from "@/config/db";
import { checkAccess } from "@/middleware/auth";
import { z } from "zod";
import { users } from "@/config/db/schema/admin";
import { HttpCode, HttpError } from "@/config/errors";
import { eq } from "drizzle-orm";
const router = express.Router();

const querySchema = z.object({
    email: z.string().email(),
});

router.get(
    "/",
    checkAccess("member:read"),
    asyncHandler(async (req, res, next) => {
        const parsed = querySchema.parse(req.body);
        const user = await db.query.users.findMany({
            where: eq(users.email, parsed.email),
            with: {
                faculty: true,
                phd: true,
            }
        })
        if (user.length === 0) {
            return next(new HttpError(HttpCode.NOT_FOUND, "User not found"));
        }
        res.status(200).json(user[0]);
    })
);

export default router;
