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
        const handouts = await db.query.courseHandoutRequests.findMany({
            where: (handout, { eq }) =>
                eq(handout.reviewerEmail, req.user!.email),
            with: {
                ic: {
                    with: {
                        faculty: true,
                    },
                },
            },
        });
        res.status(200).json({ success: true, handouts });
    })
);

export default router;
