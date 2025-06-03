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
                where: (handout, { eq, and, isNotNull }) =>
                    and(
                        eq(handout.icEmail, req.user!.email),
                        isNotNull(handout.deadline)
                    ),
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
                ...handout,
                reviewerName: handout.reviewer?.faculty?.name ?? "N/A",
            };
        });

        res.status(200).json({
            success: true,
            data: handouts,
        });
    })
);

export default router;