import express from "express";
import db from "@/config/db/index.ts";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { eq } from "drizzle-orm";
import { qpSchemas } from "lib";
import { checkAccess } from "@/middleware/auth.ts";
import logger from "@/config/logger.ts";

const router = express.Router();

router.post("/", checkAccess(), async (req, res) => {
    const parsed = qpSchemas.submitQpReviewSchema.safeParse(req.body);

    if (!parsed.success) {
        logger.debug("Validation errors:", parsed.error.errors);
        return res.status(400).json({
            success: false,
            message: "Invalid request data",
            errors: parsed.error.errors,
        });
    }

    const { requestId, review } = parsed.data;

    // find request by ID
    const request = await db.query.qpReviewRequests.findFirst({
        where: eq(qpReviewRequests.id, requestId),
    });

    if (!request) {
        return res.status(404).json({
            success: false,
            message: "Review request not found",
        });
    }

    const updateFields: Record<string, any> = {};

    // reviewer check
    if (request.reviewerEmail === req.user?.email) {
        updateFields.review = review; // ✅ matches schema column
    } else {
        return res.status(403).json({
            success: false,
            message: "Unauthorized to submit review",
        });
    }

    // guard against empty updates
    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({
            success: false,
            message: "No valid fields to update",
        });
    }

    const updateResult = await db
        .update(qpReviewRequests)
        .set(updateFields)
        .where(eq(qpReviewRequests.id, requestId));

    if (updateResult.rowCount === 0) {
        throw new Error("Failed to update review record");
    }

    return res.status(200).json({
        success: true,
        message: "Review submitted successfully",
        data: { requestId, updatedFields: Object.keys(updateFields) },
    });
});

export default router;
