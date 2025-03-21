import express from "express";
import assignICandReviewer from "./assignICandReviewer.ts";
import getAllPendingHandoutsDCA from "./getAllPendingHandoutsDCA.ts";

const router = express.Router();

router.use("/assignICandReviewer", assignICandReviewer);
router.use("/getAllPendingHandoutsDCA", getAllPendingHandoutsDCA);

export default router;
