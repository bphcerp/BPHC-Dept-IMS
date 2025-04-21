import db from "@/config/db/index.ts";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { qpSchemas } from "lib";
import { eq } from "drizzle-orm";

const router = express.Router();

router.post(
    "/",
    asyncHandler(async (req, res, next) => {
        const parsed = qpSchemas.updateIcBodySchema.parse(req.body);

        const icExists = await db.query.users.findFirst({
            where: (user, { eq }) => eq(user.email, parsed.icEmail),
        });

        if (!icExists) {
            return next(new HttpError(HttpCode.NOT_FOUND, "IC does not exist"));
        }

        const reviewExists = await db.query.qpReviewRequests.findFirst({
            where: (review, { eq }) => eq(review.id, Number(parsed.id)),
        });

        if (!reviewExists) {
            return next(new HttpError(HttpCode.NOT_FOUND, "QP review request does not exist"));
        }

        await db
            .update(qpReviewRequests)
            .set({
                icEmail: parsed.icEmail,
            })
            .where(eq(qpReviewRequests.id, Number(parsed.id)))
            .returning();

        res.status(200).json({ success: true });
    })
);

export default router;
