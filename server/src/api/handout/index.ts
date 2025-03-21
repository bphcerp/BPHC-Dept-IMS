import express from "express";
import assignICandReviewer from "./assignICandReviewer.ts";
import getAllPendingHandoutsDCA from "./getAllPendingHandoutsDCA.ts";
import submitHandout from "./submitHandout.ts";

const router = express.Router();

router.use("/assignICandReviewer", assignICandReviewer);
router.use("/getAllPendingHandoutsDCA", getAllPendingHandoutsDCA);
router.use("/submitHandout", submitHandout);

export default router;
