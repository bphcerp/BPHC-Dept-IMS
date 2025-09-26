// server/src/api/phd-request/supervisor/index.ts
import express from "express";
import createRequestRouter from "./createRequest.ts";
import getRequestsRouter from "./getRequests.ts";
import resubmitRequestRouter from "./resubmitRequest.ts"; 
import myStudentsStatus from "./my-students-status.ts"; 
import reviewFinalThesisRouter from "./review-final-thesis.ts";

const router = express.Router();

router.use("/create", createRequestRouter);
router.use("/requests", getRequestsRouter);
router.use("/resubmit", resubmitRequestRouter);
router.use("/my-students-status", myStudentsStatus);
router.use("/review-final-thesis", reviewFinalThesisRouter);

export default router;
