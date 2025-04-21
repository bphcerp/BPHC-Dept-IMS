import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { sql } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";
import assert from "assert";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const userEmail = req.user.email;

        const result = await db
            .select({ qualificationDate: phd.qualificationDate })
            .from(phd)
            .where(sql`${phd.email} = ${userEmail}`)
            .limit(1);

        if (!result.length) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    "Qualification date not found for the user"
                )
            );
        }

        res.status(200).json({
            success: true,
            email: userEmail,
            qualificationDate: result[0].qualificationDate,
        });
    })
);

export default router;
