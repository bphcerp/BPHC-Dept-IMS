import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSemesters } from "@/config/db/schema/phd.ts";
import { desc, asc } from "drizzle-orm";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const semesters = await db
            .select()
            .from(phdSemesters)
            .orderBy(desc(phdSemesters.year), asc(phdSemesters.semesterNumber));

        res.status(200).json({ success: true, semesters });
    })
);
