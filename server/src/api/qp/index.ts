import express from "express";
import uploadDocumentsRouter from "./uploadDocuments.ts";
import getFilesByRequestIdRouter from "./getFilesByRequestId.ts";
import submitReviewRouter from "./submitReview.ts";
import assignFacultyRouter from "./assignFaculty.ts";
import getFicSubmissionsRouter from "./getFicSubmissions.ts";
import getDcaMemberRequestsRouter from "./getDCAMemberRequests.ts";
import getAllCourses from "./getAllCourses.ts";
import getReviews from "./getReviews.ts";
import updateIcRouter from "./updateIc.ts";
import updateFacultyRouter from "./updateFaculty.ts";
import createRequestRouter from "./createRequest.ts";
import saveReviewRouter from "./saveReview.ts";
import sendReminders from "./sendReminders.ts";
import downloadReviewPdfRouter from "./downloadReviewPdf.ts";
import initiateRequestRouter from "./initateRequest.ts";
import { authMiddleware } from "@/middleware/auth.ts";

const router = express.Router();

router.use(authMiddleware);

router.use("/uploadDocuments", uploadDocumentsRouter);
router.use("/getFilesByRequestId/", getFilesByRequestIdRouter);
router.use("/submitReview", submitReviewRouter);
router.use("/saveReview", saveReviewRouter);
router.use("/assignFaculty", assignFacultyRouter);
router.use("/createRequest", createRequestRouter);
router.use("/getAllFICSubmissions", getFicSubmissionsRouter);
router.use("/getAllDcaMemberRequests", getDcaMemberRequestsRouter);
router.use("/getReviews", getReviews);
router.use("/getAllCourses", getAllCourses);
router.use("/updateIc", updateIcRouter);
router.use("/updateFaculty", updateFacultyRouter);
router.use("/sendReminders", sendReminders);
router.use("/downloadReviewPdf", downloadReviewPdfRouter);
router.use("/initiateRequest", initiateRequestRouter);

export default router;
