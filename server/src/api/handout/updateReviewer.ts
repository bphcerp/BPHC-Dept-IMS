import db from "@/config/db/index.ts";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
// import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { handoutSchemas } from "lib";
import { eq } from "drizzle-orm";

const router = express.Router();

router.post(
    "/",
    // checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = handoutSchemas.updateReviewerBodySchema.parse(req.body);
        const reviewerExists = await db.query.users.findFirst({
            where: (user, { eq }) => eq(user.email, parsed.reviewerEmail),
        });
        if (!reviewerExists) {
            return next(new HttpError(HttpCode.NOT_FOUND, "IC does not exist"));
        }
        const handoutExists = await db.query.courseHandoutRequests.findFirst({
            where: (handout, { eq }) => eq(handout.id, Number(parsed.id)),
        });
        if (!handoutExists) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Handout does not exist")
            );
        }
        await db
            .update(courseHandoutRequests)
            .set({
                reviewerEmail: parsed.reviewerEmail,
            })
            .where(eq(courseHandoutRequests.id, Number(parsed.id)))
            .returning();
        res.status(200).json({ success: true });
    })
);

export default router;
