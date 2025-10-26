import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";
import { courseGetQuerySchema } from "node_modules/lib/src/schemas/Allocation.ts";

const router = Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const { unmarked } = courseGetQuerySchema.parse(req.query);
        const result = await db.query.course.findMany({
            where: (course, { eq }) =>
                unmarked ? undefined : eq(course.markedForAllocation, true),
            orderBy: (course, { asc }) => [asc(course.code)],
            with: {
                groups: {
                    columns: {},
                    with: {
                        group: true
                    }
                }
            }
        });

        res.status(200).json(result.map((course) => ({
            ...course,
            groups: course.groups.map((group) => group.group)
        })));
    })
);

export default router;
