import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const semesters = await db.query.phdSemesters.findMany({
            orderBy: (phdSemesters, { asc, desc }) => [
                desc(phdSemesters.year),
                asc(phdSemesters.semesterNumber),
            ],
            with: {
                qualifyingExams: true,
            },
        });
        res.status(200).json({
            semesters: semesters.map((sem) => ({
                ...sem,
                qualifyingExams: sem.qualifyingExams.length,
            })),
        });
    })
);
