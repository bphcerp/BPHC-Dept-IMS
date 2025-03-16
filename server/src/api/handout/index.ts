import express from "express";
import createApplication from "./createApplication.ts";
import getAllPendingAppFaculty from "./getAllApplicationsFaculty.ts";
import getApplicationFaculty from "./getApplicationFaculty.ts";
import getAllApplicationsDCA from "./getAllApplicationsDCA.ts";
import addCommentsDCAMember from "./addCommentsDCAMember.ts";
import getReviewDCAMember from "./getReviewDCAMember.ts"

const router = express.Router();

router.use("/create", createApplication);
router.use("/getApplicationFaculty", getApplicationFaculty);
router.use("/getAllApplicationsDCA", getAllApplicationsDCA);
router.use("/getAllApplicationsFaculty", getAllPendingAppFaculty);
router.use("/addCommentsDCAMember", addCommentsDCAMember);
router.use("/getReviewDCAMember", getReviewDCAMember);

export default router;
