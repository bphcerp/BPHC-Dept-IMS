import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";

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
        });

        res.status(200).json({
            exams,
        });
    })
);
