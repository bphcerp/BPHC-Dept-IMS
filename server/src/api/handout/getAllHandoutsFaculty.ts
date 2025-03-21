import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import assert from "assert";
const router = express.Router();

router.get(
    "/",
    checkAccess("faculty-get-all-handouts"),
    asyncHandler(async (req, res, _next) => {
        assert(req.user);
        
        const handouts = (
            await db.query.courseHandoutRequests.findMany({
                where: (handout, { eq }) => eq(handout.icEmail, req.user?.email!),
                with: {
                    reviewer: true,
                },
            })
        ).map((handout) => {
            return {
                courseName: handout.courseName,
                courseCode: handout.courseCode,
                reviewerName: handout.reviewer?.name || null
            };
        });

        res.status(200).json({
            success: true,
            data: handouts,
        });
    })
);

export default router;