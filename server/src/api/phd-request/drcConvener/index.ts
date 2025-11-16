import express from "express";
import getRequestsRouter from "./getRequests.ts";
import reviewRequestRouter from "./reviewRequest.ts";
import reviewFinalThesisRouter from "./reviewFinalThesis.ts";
import reviewEditRequestRouter from "./reviewEditRequest.ts";

const router = express.Router();

router.use("/requests", getRequestsRouter);
router.use("/review", reviewRequestRouter);
router.use("/review-final-thesis", reviewFinalThesisRouter);
router.use("/review-edit", reviewEditRequestRouter);

export default router;
