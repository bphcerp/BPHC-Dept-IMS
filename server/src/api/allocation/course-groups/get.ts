import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
const router = express.Router();

router.get(
    "/",
    asyncHandler(async (_req, res) => {
        const groups = await db.query.allocationCourseGroup.findMany();
        res.json(groups);
    })
);

export default router;