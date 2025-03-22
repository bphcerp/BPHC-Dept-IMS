import express from "express";
import assignICandReviewer from "./assignICandReviewer.ts";
import getAllPendingHandoutsDCA from "./getAllPendingHandoutsDCA.ts";
import submitHandout from "./submitHandout.ts";
import getAllHandoutsFaculty from "./getAllHandoutsFaculty.ts";

const router = express.Router();

router.use("/assignICandReviewer", assignICandReviewer);
router.use("/getAllPendingHandoutsDCA", getAllPendingHandoutsDCA);
router.use("/submitHandout", submitHandout);
router.use("/getAllHandoutsFaculty", getAllHandoutsFaculty);

export default router;
