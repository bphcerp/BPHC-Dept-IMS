import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
// import { checkAccess } from "@/middleware/auth.ts";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get(
    "/:ficEmail",
    // checkAccess(),
    asyncHandler(async (req, res) => {
        const { ficEmail } = req.params;

        const submissions = await db.query.qpReviewRequests.findMany({
            where: eq(qpReviewRequests.ficEmail, ficEmail),
            orderBy: (qpReviewRequests, { desc }) => [
                desc(qpReviewRequests.createdAt),
            ],
            columns: {
                id: true,
                courseName: true,
                ficDeadline: true,
                ficEmail: true,
                status: true,
                reviewed: true,
                courseCode: true,
                documentsUploaded: true,
            },
            with: {
                fic: {
                    with: {
                        faculty: true,
                    },
                },
            },
        });

        const today = new Date();

        const formattedSubmissions = submissions.map((submission) => {
            const deadline = submission.ficDeadline
                ? new Date(submission.ficDeadline)
                : new Date();
            const daysLeft = Math.ceil(
                (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            const ficName = submission.fic?.faculty?.name || "Unknown";

            return {
                id: submission.id.toString(),
                courseName: submission.courseName,
                courseCode: submission.courseCode,
                deadline: submission.ficDeadline,
                daysLeft,
                ficName,
                status: submission.status,
                reviewed: submission.reviewed,
                documentsUploaded: submission.documentsUploaded,
            };
        });

        console.log(formattedSubmissions);

        res.status(200).json({
            success: true,
            message: `Fetched ${formattedSubmissions.length} submissions for FIC: ${ficEmail}`,
            data: formattedSubmissions,
        });
    })
);

export default router;
