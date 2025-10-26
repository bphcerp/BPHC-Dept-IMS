import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { courseGroupInsertQueryParamSchema } from "node_modules/lib/src/schemas/Allocation.ts";
const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const { courses } = courseGroupInsertQueryParamSchema.parse(req.query);
        const groups = await db.query.allocationCourseGroup.findMany({
            with: {
                courses: courses
                    ? {
                          columns: {},
                          with: {
                              course: true,
                          },
                      }
                    : undefined,
            },
        });

        if (!courses) {
            res.json(groups);
            return;
        }

        res.json(
            groups.map((group) => ({
                ...group,
                courses: (group.courses as Extract<typeof group.courses[number], { course: any }>[]).map((courseMap) => courseMap.course),
            }))
        );
    })
);

export default router;
