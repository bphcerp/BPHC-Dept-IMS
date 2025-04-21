import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import express from "express";
// import { checkAccess } from "@/middleware/auth.ts";
const router = express.Router();

router.get(
    "/",
    // checkAccess(),
    asyncHandler(async (req, res, _next) => {
        assert(req.user);
        const courses = (
            await db.query.qpReviewRequests.findMany({
                where: (course, { eq }) =>
                    eq(course.reviewerEmail, req.user!.email),
                with: {
                    ic: {
                        with: {
                            faculty: true,
                        },
                    },
                },
            })
        ).map((course) => {
            return {
                ...course,
                professorName: course.ic?.faculty?.name ?? "N/A",
            };
        });
        res.status(200).json({ success: true, courses });
    })
);

export default router;