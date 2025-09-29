import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import assert from "assert";
import { checkAccess } from "@/middleware/auth.ts";
const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, _next) => {
        assert(req.user);

        const courses = (
            await db.query.qpReviewRequests.findMany({
                where: (course, { eq }) =>
                    eq(course.icEmail, req.user!.email),
                with: {
                    reviewer: {
                        with: {
                            faculty: true,
                        },
                    },
                },
            })
        ).map((course) => {
            return {
                ...course,
                reviewerName: course.reviewer?.faculty?.name ?? "N/A",
            };
        });

        res.status(200).json({
            success: true,
            data: courses,
        });
    })
);

export default router;
