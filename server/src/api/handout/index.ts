import express from "express";
import assignIC from "./assignIC.ts";
import getAllPendingHandoutsDCA from "./getAllPendingHandoutsDCA.ts";
import submitHandout from "./submitHandout.ts";
import getAllHandoutsFaculty from "./getAllHandoutsFaculty.ts";
import assignReviewer from "./assignReviewer.ts";

const router = express.Router();

router.use("/assignIC", assignIC);
router.use("/getAllPendingHandoutsDCA", getAllPendingHandoutsDCA);
router.use("/submitHandout", submitHandout);
router.use("/getAllHandoutsFaculty", getAllHandoutsFaculty);
router.use("/assignReviewer", assignReviewer);

export default router;
