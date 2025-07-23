import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import { handoutSchemas } from "lib";
import assert from "assert";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { eq, and } from "drizzle-orm";
import { completeTodo } from "@/lib/todos/index.ts";

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
        const { handoutId, comments, ...updateFields } = parsed;
        const result = await db
            .update(courseHandoutRequests)
            .set({
                ...(updateFields as {
                    scopeAndObjective: boolean;
                    textBookPrescribed: boolean;
                    lecturewisePlanLearningObjective: boolean;
                    lecturewisePlanCourseTopics: boolean;
                    numberOfLP: boolean;
                    evaluationScheme: boolean;
                    ncCriteria: boolean;
                }),
                status: "reviewed",
                comments,
            })
            .where(
                and(
                    eq(courseHandoutRequests.id, handoutId),
                    eq(courseHandoutRequests.reviewerEmail, req.user!.email)
                )
            )
            .returning();
        if (result.length > 0) {
            await completeTodo({
                module: "Course Handout",
                assignedTo: req.user.email,
                completionEvent: `handout review ${result[0].courseCode} by ${result[0].reviewerEmail}`,
            });
        }

        res.status(200).json({
            success: true,
            message: "Handout review updated",
            data: result[0],
        });
    })
);

export default router;
