import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
const router = express.Router();

router.get(
    "/",
    asyncHandler(async (_req, res, _next) => {
        const courses = (
            await db.query.qpReviewRequests.findMany({
                with: {
                    ic: {
                        with: {
                            faculty: true,
                        },
                    },
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
                professorName: course.ic?.faculty?.name ?? "N/A",
            };
        });

        res.status(200).json({ success: true, courses });
    })
);

export default router;
