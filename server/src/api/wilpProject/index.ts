import express from "express";
import upload from "./upload.ts";
import clear from "./clear.ts";
import download from "./download.ts";
import viewAll from "./view-all.ts";
import viewSelected from "./view-selected.ts";
import viewDetails from "./view-details.ts";
import select from "./select.ts";
import deselect from "./deselect.ts";
import setRange from "./setRange.ts";
import bulkMail from "./bulkMail.ts";
import stats from "./stats.ts";

const router = express.Router();

router.use("/upload", upload);
router.use("/clear", clear);
router.use("/download", download);
router.use("/view/all", viewAll);
router.use("/view/selected", viewSelected);
router.use("/view", viewDetails);
router.use("/select", select)
router.use("/deselect", deselect)
router.use("/setRange", setRange)
router.use("/mail", bulkMail)
router.use("/stats", stats)

export default router;
