import db from "@/config/db/index.ts";
import {
    allocationCourseGroup,
    allocationCourseGroupMapping,
} from "@/config/db/schema/allocation.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { inArray, eq, and } from "drizzle-orm";
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

        const insertValues = courseCodes.map((code) => ({
            groupId,
            courseCode: code,
        }));

        if (courseCodes && courseCodes.length) {
            await db
                .insert(allocationCourseGroupMapping)
                .values(insertValues)
                .onConflictDoNothing();
        }

        if (removedCourseCodes && removedCourseCodes.length) {
            await db
                .delete(allocationCourseGroupMapping)
                .where(
                    and(
                        eq(allocationCourseGroupMapping.groupId, groupId),
                        inArray(
                            allocationCourseGroupMapping.courseCode,
                            removedCourseCodes
                        )
                    )
                );
        }

        res.send("Courses added to group successfully");
    })
);

export default router;
