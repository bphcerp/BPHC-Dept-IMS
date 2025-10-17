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
        });

        res.status(200).json(result);
    })
);

export default router;
