import express from "express";
import createApplicationRouter from "./createApplication.ts";
import viewApplicationDetailsRouter from "./viewApplicationDetails.ts";
import reviewApplicationFieldRouter from "./reviewApplicationField.ts";

const router = express.Router();

router.use("/createApplication", createApplicationRouter);
router.use("/details", viewApplicationDetailsRouter);
router.use("/review", reviewApplicationFieldRouter);

export default router;
