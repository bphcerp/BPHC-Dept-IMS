import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.post(
    "/approveSubmission",
    checkAccess(),
    asyncHandler(async (req, res: any) => {
        const { requestId } = req.body;

        const request = await db.query.qpReviewRequests.findFirst({
            where: eq(qpReviewRequests.id, Number(requestId)),
            columns: { reviewed: true },
        });

        if (!request) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "QP review request not found",
                });
        }

        if (request.reviewed !== "reviewed") {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Review must be completed before approval.",
                });
        }

        const [updatedRequest] = await db
            .update(qpReviewRequests)
            .set({ reviewed: "approved" })
            .where(eq(qpReviewRequests.id, Number(requestId)))
            .returning();

        if (!updatedRequest) {
            return res
                .status(500)
                .json({
                    success: false,
                    message: "Failed to approve submission.",
                });
        }

        return res.status(200).json({
            success: true,
            message: "Submission approved successfully.",
            data: updatedRequest,
        });
    })
);

export default router;
