import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const userEmail = req.user!.email;

        // Get all applications by the student
        const applications = await db.query.phdExamApplications.findMany({
            where: (table, { eq }) => eq(table.studentEmail, userEmail),
            with: {
                exam: {
                    with: {
                        semester: true,
                    },
                },
            },
            orderBy: (table, { desc }) => desc(table.createdAt),
        });

        if (applications.length === 0) {
            res.json({
                success: true,
                applications: [],
                message: "No applications found",
            });
            return;
        }

        const formattedApplications = applications.map((app) => ({
            id: app.id,
            examId: app.examId,
            examName: app.exam.examName,
            status: app.status,
            qualifyingArea1: app.qualifyingArea1,
            qualifyingArea2: app.qualifyingArea2,
            comments: app.comments,
            semester: {
                year: app.exam.semester.year,
                semesterNumber: app.exam.semester.semesterNumber,
            },
            submissionDeadline: app.exam.submissionDeadline,
            examStartDate: app.exam.examStartDate,
            examEndDate: app.exam.examEndDate,
            vivaDate: app.exam.vivaDate,
            createdAt: app.createdAt,
        }));

        res.json({
            success: true,
            applications: formattedApplications,
        });
    })
);
