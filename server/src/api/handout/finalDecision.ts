import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { handoutSchemas } from "lib";
import { assert } from "console";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { eq } from "drizzle-orm";
const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const parsed = handoutSchemas.finalDecisionBodySchema.parse(req.body);

        const result = await db
            .update(courseHandoutRequests)
            .set({
                status: parsed.status,
            })
            .where(eq(courseHandoutRequests.id, Number(parsed.id)))
            .returning();

        if (!result.length)
            return next(new HttpError(HttpCode.NOT_FOUND, "Handout Not Found"));

        res.status(200).json({
            success: true,
            message: "Handout review updated",
            data: result[0],
        });
    })
);

export default router;
