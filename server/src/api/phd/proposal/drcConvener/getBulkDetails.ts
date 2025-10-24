import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { users } from "@/config/db/schema/admin.ts";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

const bulkDetailsBodySchema = z.object({
    emails: z
        .array(z.string().email("Invalid email format."))
        .min(1, "At least one email is required."),
});

router.post(
    "/",
    checkAccess("phd:drc:proposal"), // Or another suitable permission
    asyncHandler(async (req, res, next) => {
        const parsed = bulkDetailsBodySchema.safeParse(req.body);

        if (!parsed.success) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    parsed.error.errors[0].message
                )
            );
        }

        const { emails } = parsed.data;

        const userDetails = await db
            .select({
                email: users.email,
                name: users.name,
            })
            .from(users)
            .where(inArray(users.email, emails));

        res.status(HttpCode.OK).json(userDetails);
    })
);

export default router;
