import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import assert from "assert";
const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, _next) => {
        assert(req.user);

        const handouts = (
            await db.query.courseHandoutRequests.findMany({
                where: (handout, { eq }) =>
                    eq(handout.icEmail, req.user?.email!),
                with: {
                    reviewer: {
                        with: {
                            faculty: true,
                        },
                    },
                },
            })
        ).map((handout) => {
            return {
                id: handout.id,
                courseName: handout.courseName,
                courseCode: handout.courseCode,
                reviewerName: handout.reviewer?.faculty.name,
                submittedOn: handout.createdAt.toISOString(),
                status: handout.status,
            };
        });

        res.status(200).json({
            success: true,
            data: handouts,
        });
    })
);

export default router;
