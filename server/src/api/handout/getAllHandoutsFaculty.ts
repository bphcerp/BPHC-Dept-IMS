import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import assert from "assert";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { getLatestCompletedSemester } from "./getLatestCompletedSemester.ts";
const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const semester = await getLatestCompletedSemester();
        if (!semester) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "No completed semester found")
            );
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
            data: handouts,
        });
    })
);

export default router;
