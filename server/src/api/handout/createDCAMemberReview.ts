import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import { handoutSchemas } from "lib";
import { assert } from "console";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { eq, and } from "drizzle-orm";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, _next) => {
        assert(req.user);

        const parsed =
            handoutSchemas.createHandoutDCAMemberReviewBodySchema.parse(
                req.body
            );
        const { handoutId, ...updateFields } = parsed;

        const result = await db
            .update(courseHandoutRequests)
            .set(
                updateFields as {
                    scopeAndObjective: boolean;
                    textBookPrescribed: boolean;
                    lecturewisePlanLearningObjective: boolean;
                    lecturewisePlanCourseTopics: boolean;
                    numberOfLP: boolean;
                    evaluationScheme: boolean;
                }
            )
            .where(
                and(
                    eq(courseHandoutRequests.id, handoutId),
                    eq(courseHandoutRequests.reviewerEmail, req.user!.email)
                )
            )
            .returning();

        res.status(200).json({
            success: true,
            message: "Handout review updated",
            data: result[0],
        });
    })
);

export default router;
