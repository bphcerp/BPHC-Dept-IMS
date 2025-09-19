import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.post(
    "/:email/:id",
    asyncHandler(async (req : any, res: any) => {
        const { email, id } = req.params;

        const request = await db.query.qpReviewRequests.findFirst({
            where: eq(qpReviewRequests.id, Number(id)),
            columns: { status: true },
        });

        if (!request) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "QP review request not found",
                });
        }

        if (request.status !== "reviewed") {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Review must be completed before approval.",
                });
        }

        const [updatedRequest] = await db
            .update(qpReviewRequests)
            .set({ status: "rejected" })
            .where(eq(qpReviewRequests.id, Number(id)))
            .returning();

        if (!updatedRequest) {
            return res
                .status(500)
                .json({
                    success: false,
                    message: "Failed to reject submission.",
                });
        }

        return res.status(200).json({
            success: true,
            message: "Submission rejected successfully.",
            data: updatedRequest,
        });
    })
);

export default router;
