import express from "express";
import db from "@/config/db/index.ts";
import { eq } from "drizzle-orm";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";

const router = express.Router();

router.get("/:email/:requestId", async (req, res) => {
    try {
      const { email, requestId } = req.params;
  
      const request = await db.query.qpReviewRequests.findFirst({
        where: eq(qpReviewRequests.id, Number(requestId)),
      });
  
      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Review request not found",
        });
      }
  
      // Determine which review to return based on email
      let reviewData;
      if (request.faculty1Email === email) {
        reviewData = request.review1;
      } else if (request.faculty2Email === email) {
        reviewData = request.review2;
      } else {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to access this review",
        });
      }
  
      return res.status(200).json({
        success: true,
        data: reviewData || null,
      });
  
    } catch (error) {
      console.error("Error fetching review:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch review",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  
  

export default router;
