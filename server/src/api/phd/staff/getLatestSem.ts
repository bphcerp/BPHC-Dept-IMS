import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const semester = await db.query.phdSemesters.findFirst({
            orderBy: (phdSemesters, { desc }) => [
                desc(phdSemesters.year),
                desc(phdSemesters.semesterNumber),
            ],
        });
        res.status(200).json({
            semester,
        });
    })
);

export default router;
