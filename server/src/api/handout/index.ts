import express from "express";
import assignICandReviewer from "./assignICandReviewer.ts";
import getAllPendingHandoutsDCA from "./getAllPendingHandoutsDCA.ts";
import submitHandout from "./submitHandout.ts";
import getAllHandoutsFaculty from "./getAllHandoutsFaculty.ts";
import createDCAMemberReview from "./createDCAMemberReview.ts";

const router = express.Router();

router.use("/assignICandReviewer", assignICandReviewer);
router.use("/getAllPendingHandoutsDCA", getAllPendingHandoutsDCA);
router.use("/submitHandout", submitHandout);
router.use("/getAllHandoutsFaculty", getAllHandoutsFaculty);
router.use("/createDCAMemberReview", createDCAMemberReview);

export default router;
