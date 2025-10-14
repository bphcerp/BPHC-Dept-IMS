import db from "@/config/db/index.ts";
import { allocationCourseGroup } from "@/config/db/schema/allocation.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { courseGroupSchema } from "node_modules/lib/src/schemas/Allocation.ts";
const router = express.Router();

router.post(
    "/",
    asyncHandler(async (req, res, next) => {
        const { name, description } = courseGroupSchema.parse(req.body);
        if (!name) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Group name is required")
            );
        }
        const group = await db
            .insert(allocationCourseGroup)
            .values({ name, description });
        res.json(group);
    })
);

export default router;
