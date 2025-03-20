import db from "@/config/db/index.ts";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { handoutSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    // checkAccess("dca-assign-reviewers"),
    asyncHandler(async (req, res, _next) => {
        const parsed = handoutSchemas.assignBodySchema.parse(req.body);

        await db.insert(courseHandoutRequests).values({
            icEmail: parsed.icEmail,
            reviewerEmail: parsed.reviewerEmail,
            courseCode: parsed.courseCode,
            courseName: parsed.courseName,
        });

        res.status(201).json({ success: true });
    })
);

export default router;
