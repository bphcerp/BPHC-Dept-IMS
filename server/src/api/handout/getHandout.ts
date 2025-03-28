import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { handoutSchemas } from "lib";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res, next) => {
        const parsed = handoutSchemas.getReviewQuerySchema.parse(req.query);

        const handout = await db.query.courseHandoutRequests.findFirst({
            where: (handout, { eq }) =>
                eq(handout.id, Number(parsed.handoutId)),
        });

        if (!handout)
            return next(new HttpError(HttpCode.NOT_FOUND, "Handout Not Found"));

        res.status(200).json({ status: true, handout });
    })
);

export default router;
