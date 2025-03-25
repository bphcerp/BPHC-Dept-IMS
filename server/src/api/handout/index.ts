import express from "express";
import assignIC from "./assignIC.ts";
import getAllPendingHandoutsDCA from "./getAllPendingHandoutsDCA.ts";
import submitHandout from "./submitHandout.ts";
import getAllHandoutsFaculty from "./getAllHandoutsFaculty.ts";
import createDCAMemberReview from "./createDCAMemberReview.ts";
import assignReviewer from "./assignReviewer.ts";

const router = express.Router();

router.use("/assignIC", assignIC);
router.use("/dca/get", getAllPendingHandoutsDCA);
router.use("/faculty/submit", submitHandout);
router.use("/faculty/get", getAllHandoutsFaculty);
router.use("/dca/review", createDCAMemberReview);
router.use("/dca/assignReviewer", assignReviewer);

export default router;
