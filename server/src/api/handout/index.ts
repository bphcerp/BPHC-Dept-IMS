import express from "express";
import assignIC from "./assignIC.ts";
import getAllHandoutsDCA from "./getAllHandoutsDCA.ts";
import submitHandout from "./submitHandout.ts";
import getAllHandoutsFaculty from "./getAllHandoutsFaculty.ts";
import createDCAMemberReview from "./createDCAMemberReview.ts";
import assignReviewer from "./assignReviewer.ts";
import getHandout from "./getHandout.ts";

const router = express.Router();

router.use("/assignIC", assignIC);
router.use("/dca/get", getAllHandoutsDCA);
router.use("/faculty/submit", submitHandout);
router.use("/faculty/get", getAllHandoutsFaculty);
router.use("/dca/review", createDCAMemberReview);
router.use("/dca/assignReviewer", assignReviewer);
router.use("/get", getHandout);

export default router;
