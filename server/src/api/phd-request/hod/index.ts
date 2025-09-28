import express from "express";
import getRequestsRouter from "./getRequests.ts";
import submitReviewRouter from "./submitReview.ts";
import reviewFinalThesisRouter from "./reviewFinalThesis.ts";

const router = express.Router();

router.use("/requests", getRequestsRouter);
router.use("/review", submitReviewRouter);
router.use("/review-final-thesis", reviewFinalThesisRouter);

export default router;
