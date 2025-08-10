import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSemesters } from "@/config/db/schema/phd.ts";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const exams = await db.query.phdQualifyingExams.findMany({
            with: {
                semester: {
                    columns: {
                        year: true,
                        semesterNumber: true,
                    },
                },
            },
            columns: {
                id: true,
                examName: true,
                examStartDate: true,
                examEndDate: true,
                submissionDeadline: true,
                vivaDate: true,
            },
            orderBy: (table, { desc }) => [
                desc(phdSemesters.year),
                desc(phdSemesters.semesterNumber),
                desc(table.createdAt),
            ],
        });

        res.status(200).json({
            exams,
        });
    })
);
