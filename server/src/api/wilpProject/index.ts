import express from "express";
import upload from "./upload.ts";
import viewAll from "./view-all.ts";
import viewSelected from "./view-selected.ts";
import viewDetails from "./view-details.ts";

const router = express.Router();

router.use("/upload", upload);
router.use("/view/all", viewAll);
router.use("/view/selected", viewSelected);
router.use("/view", viewDetails);

export default router;
