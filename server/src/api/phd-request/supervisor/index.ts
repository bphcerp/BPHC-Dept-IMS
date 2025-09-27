import express from "express";
import myStudentsRouter from "./myStudents.ts";
import createRequestRouter from "./createRequest.ts";
import resubmitRequestRouter from "./resubmitRequest.ts";
import reviewFinalThesisRouter from "./reviewFinalThesis.ts";

const router = express.Router();

router.use("/my-students", myStudentsRouter);
router.use("/create", createRequestRouter);
router.use("/resubmit", resubmitRequestRouter);
router.use("/review-final-thesis", reviewFinalThesisRouter);

export default router;
