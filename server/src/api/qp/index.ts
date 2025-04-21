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

const router = express.Router();

router.use("/uploadDocuments", uploadDocumentsRouter);
router.use("/getFilesByRequestId/", getFilesByRequestIdRouter);
router.use("/submitReview", submitReviewRouter);
// router.use("/approveSubmission", approveSubmissionRouter);
router.use("/assignFaculty", assignFacultyRouter);
router.use("/getAllFICSubmissions", getFicSubmissionsRouter);
router.use("/editQpRequest/:id", editQpRequestRouter);
router.use("/getAllDcaMemberRequests", getDcaMemberRequestsRouter);
router.use("/getReviews", getReviews);
router.use("/getAllCourses", getAllCourses);
router.use("/assignIc", assignICRouter);
router.use("/updateIc", updateIcRouter);
router.use("/updateFaculty", updateFacultyRouter);

export default router;
