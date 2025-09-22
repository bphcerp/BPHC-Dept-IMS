import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { courseCodeSchema } from "node_modules/lib/src/schemas/Allocation.ts";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res, _next) => {
        const { code } = courseCodeSchema.parse(req.query);

        const allocations = await db.query.masterAllocation.findFirst({
            where: (master, { eq }) => eq(master.courseCode, code),
            with: {
                sections: {
                    with: {
                        instructors: {
                            with: {
                                instructor: true,
                            },
                        },
                    },
                },
                ic: true,
            },
        });

        res.status(200).json(allocations);
    })
);

export default router;
