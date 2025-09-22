import express from "express";
import uploadDocumentsRouter from "./uploadDocuments.ts"
import getFilesByRequestIdRouter from "./getFilesByRequestId.ts";
import submitReviewRouter from "./submitReview.ts";
import assignFacultyRouter from "./assignFaculty.ts";
import getFicSubmissionsRouter from "./getFicSubmissions.ts"
import editQpRequestRouter from "./editQpRequest.ts"
import getDcaMemberRequestsRouter from "./getDCAMemberRequests.ts"
import getAllCourses from './getAllCourses.ts'
import getReviews from './getReviews.ts'
import assignICRouter from './assignIc.ts'
import updateIcRouter from './updateIc.ts'
import updateFacultyRouter from './updateFaculty.ts'
import createRequestRouter from "./createRequest.ts"
import approveSubmissionRouter from "./approveSubmission.ts"
import rejectSubmissionRouter from "./rejectSubmission.ts"
import saveReviewRouter from "./saveReview.ts"
import sendReminders from "./sendReminders.ts"
import downloadReviewPdfRouter from "./downloadReviewPdf.ts"

const router = express.Router();

router.use("/uploadDocuments", uploadDocumentsRouter);
router.use("/getFilesByRequestId/", getFilesByRequestIdRouter);
router.use("/submitReview", submitReviewRouter);
router.use("/saveReview", saveReviewRouter);
router.use("/approveSubmission", approveSubmissionRouter);
router.use("/rejectSubmission", rejectSubmissionRouter);
router.use("/assignFaculty", assignFacultyRouter);
router.use("/createRequest" , createRequestRouter)
router.use("/getAllFICSubmissions", getFicSubmissionsRouter);
router.use("/editQpRequest/:id", editQpRequestRouter);
router.use("/getAllDcaMemberRequests", getDcaMemberRequestsRouter);
router.use("/getReviews", getReviews);
router.use("/getAllCourses", getAllCourses);
router.use("/assignIc", assignICRouter);
router.use("/updateIc", updateIcRouter);
router.use("/updateFaculty", updateFacultyRouter);
router.use("/sendReminders", sendReminders);
router.use("/downloadReviewPdf", downloadReviewPdfRouter);

export default router;
