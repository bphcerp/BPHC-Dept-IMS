import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { courseCodeSchema } from "node_modules/lib/src/schemas/Allocation.ts";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res, _next) => {
        const { code } = courseCodeSchema.parse(req.query);

        const faculties = await db.query.allocationFormResponse.findMany({
            where: (response, { eq }) => eq(response.courseCode, code),
            with: {
                submittedBy: true,
                templateField: true,
            },
        });

        res.status(200).json(faculties);
    })
);

export default router;
