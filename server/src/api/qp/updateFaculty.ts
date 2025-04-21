import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { qpSchemas } from "lib";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.post(
    "/",
    asyncHandler(async (req, res, next) => {
        const parsed = qpSchemas.updateReviewerBodySchema.parse(req.body);
        
        const reviewerExists = await db.query.users.findFirst({
            where: (user, { eq }) => eq(user.email, parsed.reviewerEmail),
        });

        if (!reviewerExists) {
            return next(new HttpError(HttpCode.NOT_FOUND, "Reviewer does not exist"));
        }

        const reviewRequestExists = await db.query.qpReviewRequests.findFirst({
            where: (reqItem, { eq }) => eq(reqItem.id, Number(parsed.id)),
        });

        if (!reviewRequestExists) {
            return next(new HttpError(HttpCode.NOT_FOUND, "QP review request does not exist"));
        }

        await db
            .update(qpReviewRequests)
            .set({
                reviewerEmail: parsed.reviewerEmail,
            })
            .where(eq(qpReviewRequests.id, Number(parsed.id)))
            .returning();

        res.status(200).json({ success: true });
    })
);

export default router;
