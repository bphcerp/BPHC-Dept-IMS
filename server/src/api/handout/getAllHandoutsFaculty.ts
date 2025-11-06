import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import assert from "assert";
import { getLatestCompletedSemester } from "./getLatestCompletedSemester.ts";
const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, _next) => {
        assert(req.user);
        const semester = await getLatestCompletedSemester();
        if (!semester) {
            res.status(200).json({ success: true, handouts: null });
            return;
        }
        const handouts = (
            await db.query.courseHandoutRequests.findMany({
                where: (handout, { eq, and, isNotNull }) =>
                    and(
                        eq(handout.icEmail, req.user!.email),
                        isNotNull(handout.deadline),
                        eq(handout.semesterId, semester.id)
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
            handouts,
        });
    })
);

export default router;
