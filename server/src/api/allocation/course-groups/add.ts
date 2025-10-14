import db from "@/config/db/index.ts";
import {
    allocationCourseGroup,
    course,
} from "@/config/db/schema/allocation.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { inArray, eq } from "drizzle-orm";
import { Router } from "express";
import { courseGroupCourseAddSchema } from "node_modules/lib/src/schemas/Allocation.ts";

const router = Router();

router.post(
    "/:groupId",
    asyncHandler(async (req, res, next) => {
        const { courseCodes, removedCourseCodes } =
            courseGroupCourseAddSchema.parse(req.body);
        const { groupId } = req.params;
        if (!groupId) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Missing or invalid groupId query param"
                )
            );
        }

        const group = await db
            .select()
            .from(allocationCourseGroup)
            .where(eq(allocationCourseGroup.id, groupId))
            .limit(1);
        if (!group.length) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Course group not found")
            );
        }

        await db
            .update(course)
            .set({ groupId })
            .where(inArray(course.code, courseCodes));

        if (removedCourseCodes && removedCourseCodes.length > 0) {
            await db
                .update(course)
                .set({ groupId: null })
                .where(inArray(course.code, removedCourseCodes));
        }

        res.send("Courses added to group successfully");
    })
);

export default router;
