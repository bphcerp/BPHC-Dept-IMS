import express from "express";
import db from "@/config/db/index.ts";
import { eq } from "drizzle-orm";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { checkAccess } from "@/middleware/auth.ts";
import logger from "@/config/logger.ts";

const router = express.Router();

/**
 * GET /api/qp/:email/:requestId
 * Fetch review data for a given requestId and reviewer email
 */
router.get("/:requestId",checkAccess(), async (req, res) => {
        const {  requestId } = req.params;

        // ✅ Validate requestId
        const id = Number(requestId);
        if (isNaN(id) || id <= 0) {
            logger.debug("Invalid requestId:", requestId);
            return res.status(400).json({
                success: false,
                message: "Invalid requestId. Must be a positive number",
            });
        }

        // ✅ Fetch the review request
        const request = await db.query.qpReviewRequests.findFirst({
            where: eq(qpReviewRequests.id, id),
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Review request not found",
            });
        }

        // ✅ Check authorization
        // if (request.reviewerEmail !== email && request.icEmail !== email) {
        //     return res.status(403).json({
        //         success: false,
        //         message: "Unauthorized to access this review",
        //     });
        // }

        const dataToReturn = {
            courseName : request.courseName,
            courseCode : request.courseCode,
            review : request.review,
        }

        // ✅ Send review data
        return res.status(200).json({
            success: true,
            data: dataToReturn,
        });

});

export default router;
