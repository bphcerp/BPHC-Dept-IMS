// server/src/api/phd-request/hod/index.ts
import express from "express";
import getRequestsRouter from "./getRequests.ts";
import submitReviewRouter from "./submitReview.ts";

const router = express.Router();

router.use("/requests", getRequestsRouter);
router.use("/review", submitReviewRouter);

export default router;
