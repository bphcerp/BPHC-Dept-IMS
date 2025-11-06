import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { getLatestCompletedSemester } from "./getLatestCompletedSemester.ts";
const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res, next) => {
        const semester = await getLatestCompletedSemester();
        if (!semester) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "No completed semester found")
            );
        }
        const handouts = (
            await db.query.courseHandoutRequests.findMany({
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
                where: (handout, { eq }) => eq(handout.semesterId, semester.id),
            })
        ).map((handout) => {
            return {
                ...handout,
                reviewerName: handout.reviewer?.faculty?.name ?? "N/A",
                professorName: handout.ic?.faculty?.name ?? "N/A",
            };
        });

        res.status(200).json({ success: true, handouts });
    })
);

export default router;
