import express from "express";
import createQpReviewRouter from "./createQpReviewRequest.ts";
import uploadFICDocumentsRouter from "./uploadDocuments.ts";
import getFilesByRequestIdRouter from "./getFilesByRequestId.ts";
import submitReviewRouter from "./submitReview.ts";
import approveSubmissionRouter from "./approveSubmission.ts";
import assignFacultyRouter from "./assignFaculty.ts";
import getFicSubmissionsRouter from "./getFicSubmissions.ts";
import editQpRequestRouter from "./editQpRequest.ts";
import getDCARequestRouter from "./getDCARequests.ts";
import getFacultyRequestsRouter from "./getFacultyRequests.ts";
import getReviews from "./getReviews.ts";

const router = express.Router();

router.use("/createQpRequest", createQpReviewRouter);
router.use("/uploadFICDocuments", uploadFICDocumentsRouter);
router.use("/getFilesByRequestId/", getFilesByRequestIdRouter);
router.use("/submitReview", submitReviewRouter);
router.use("/approveSubmission", approveSubmissionRouter);
router.use("/assignFaculty", assignFacultyRouter);
router.use("/getAllFICSubmissions", getFicSubmissionsRouter);
router.use("/editQpRequest/:id", editQpRequestRouter);
router.use("/getAllDcaRequests", getDCARequestRouter);
router.use("/getAllFacultyRequests", getFacultyRequestsRouter);
router.use("/getReviews", getReviews);

export default router;
