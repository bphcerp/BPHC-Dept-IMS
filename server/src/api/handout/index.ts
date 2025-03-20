import express from "express";
import assignICandReviewer from "./assignICandReviewer.ts";

const router = express.Router();

router.use("/assignICandReviwer", assignICandReviewer);

export default router;
