import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { qpSchemas } from "lib";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { users } from "@/config/db/schema/admin.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/common/email.ts";

const router = express.Router();

router.post(
    "/",
    asyncHandler(async (req, res, next) => {
        const parsed = qpSchemas.assignReviewerBodySchema.parse(req.body);
        const { id, reviewerEmail } = parsed;

        const reviewerExists = await db.query.users.findFirst({
            where: eq(users.email, reviewerEmail),
        });

        if (!reviewerExists) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Reviewer does not exist")
            );
        }

        const reviewRequest = await db.query.qpReviewRequests.findFirst({
            where: eq(qpReviewRequests.id, Number(id)),
            columns: { id: true },
        });

        if (!reviewRequest) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "QP review request not found")
            );
        }

        const updatedRequest = await db
            .update(qpReviewRequests)
            .set({
                reviewerEmail: reviewerEmail, 
            })
            .where(eq(qpReviewRequests.id, Number(id)))
            .returning();

        res.status(200).json({
            success: true,
            message: "Reviewer assigned successfully",
            data: updatedRequest[0],
        });
    })
);

export default router;
