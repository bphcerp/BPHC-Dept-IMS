import express from "express";
import createApplicationRouter from "./createApplication.ts";
import getSubmittedApplicationsRouter from "./getSubmittedApplications.ts";
import finalizeApplicationRouter from "./finalizeApplication.ts";
import getPendingApplicationsRouter from "./getPendingApplications.ts";
import viewApplicationDetailsRouter from "./viewApplicationDetails.ts";
import reviewApplicationFieldRouter from "./reviewApplicationField.ts";

const router = express.Router();

router.use("/createApplication", createApplicationRouter);
router.use("/reviewApplicationField", reviewApplicationFieldRouter);
router.use("/getPendingApplications", getPendingApplicationsRouter);
router.use("/getSubmittedApplications", getSubmittedApplicationsRouter);
router.use("/finalizeApplication", finalizeApplicationRouter);
router.use("/viewApplicationDetails", viewApplicationDetailsRouter);

export default router;
