import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res, _next) => {
        const completedSemesters = await db.query.semester.findMany({
            where: (sem, { eq, and }) =>
                and(
                    eq(sem.allocationStatus, "completed"),
                    eq(sem.active, false)
                ),
        });
        res.status(200).json(completedSemesters);
    })
);

export default router;
