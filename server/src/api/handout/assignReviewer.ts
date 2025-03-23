import db from "@/config/db/index.ts";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import express from "express";
import { handoutSchemas } from "lib";

const router = express.Router();

router.post(
    "/:id",
    checkAccess("dca-assign-reviewers"),
    asyncHandler(async (req, res, next) => {
        const parsed = handoutSchemas.assignReviewerBodySchema.parse(req.body);

        const reviewerExists = db.query.users.findFirst({
            where: (user, { eq }) => eq(user.email, parsed.reviewerEmail),
        });

        if (!reviewerExists) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Reviewer does not exist")
            );
        }

        await db
            .update(courseHandoutRequests)
            .set({
                reviewerEmail: parsed.reviewerEmail,
            })
            .where(eq(courseHandoutRequests.id, Number(parsed.id)));

        res.status(200).json({ success: true });
    })
);

export default router;
