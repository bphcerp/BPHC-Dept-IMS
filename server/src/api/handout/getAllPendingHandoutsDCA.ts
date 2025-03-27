import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth.ts";
const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, _next) => {
        assert(req.user);
        const handouts = (
            await db.query.courseHandoutRequests.findMany({
                where: (handout, { eq, and, or }) =>
                    and(
                        eq(handout.reviewerEmail, req.user!.email),
                        or(
                            eq(handout.status, "pending"),
                            eq(handout.status, "notsubmitted")
                        )
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
                id: handout.id,
                courseName: handout.courseName,
                courseCode: handout.courseCode,
                professorName: handout.ic.faculty.name,
                status: handout.status,
            };
        });

        res.status(200).json({ success: true, handouts });
    })
);

export default router;
