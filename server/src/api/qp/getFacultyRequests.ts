import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
// import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

router.get(
    "/:facultyEmail",
    // checkAccess(),
    asyncHandler(async (req, res) => {
        const { facultyEmail } = req.params;

        const requests = (
            await db.query.qpReviewRequests.findMany({
                where: (request, { eq, or }) =>
                    or(
                        eq(request.faculty1Email, facultyEmail),
                        eq(request.faculty2Email, facultyEmail)
                    ),
                with: {
                    dcaMember: {
                        with: {
                            faculty: true,
                        },
                    },
                    fic: {
                        with: {
                            faculty: true,
                        },
                    },
                },
                orderBy: (request, { desc }) => [desc(request.createdAt)],
            })
        ).map((request) => ({
            id: request.id,
            courseName: request.courseName,
            courseCode: request.courseCode,
            professor: `FIC: ${request.fic?.faculty.name || "Unknown"}`,
            deadline: request.reviewDeadline,
            DCA: `DCA: ${request.dcaMember?.faculty.name || "Unknown"}`,
            status: request.status,
        }));

        const getTimeLeft = (deadline: Date | null) => {
            let timeLeft = "NA";
            if (deadline) {
                const deadlineDate = new Date(deadline); // Convert to Date object
                const today = new Date(); // Get today's date
                const diffTime = deadlineDate.getTime() - today.getTime(); // Difference in milliseconds
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
                timeLeft =
                    diffDays > 0 ? `${diffDays} days left` : "Deadline passed"; // Handle past deadlines
            }

            return timeLeft;
        };

        const formattedRequests = requests.map((req) => ({
            id: req.id,
            code: req.courseCode,
            DCA: ` ${req.DCA || "Unknown"}`,
            role: ` ${req.professor || "Unknown"}`,
            timeLeft: getTimeLeft(req.deadline) || "N/A",
            status: req.status,
        }));

        res.status(200).json({
            success: true,
            message: `Fetched ${formattedRequests.length} requests for faculty: ${facultyEmail}`,
            data: formattedRequests,
        });
    })
);

export default router;
