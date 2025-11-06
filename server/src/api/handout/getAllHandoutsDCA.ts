import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth.ts";
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
                where: (handout, { and, eq }) =>
                    and(
                        eq(handout.reviewerEmail, req.user!.email),
                        eq(handout.semesterId, semester.id)
                    ),
                with: {
                    ic: {
                        with: {
                            faculty: true,
                        },
                    },
                },
            })
        ).map((handout) => {
            return {
                ...handout,
                professorName: handout.ic?.faculty?.name ?? "N/A",
            };
        });
        res.status(200).json({ success: true, handouts });
    })
);

export default router;
