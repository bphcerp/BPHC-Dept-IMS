import express from "express";
import createApplicationRouter from "./createApplication.ts";
import getPendingApplicationsRouter from "./getPendingApplications.ts";
import viewApplicationDetailsRouter from "./viewApplicationDetails.ts";
import reviewApplicationFieldRouter from "./reviewApplicationField.ts";

const router = express.Router();

router.use("/createApplication", createApplicationRouter);
router.use("/reviewApplicationField", reviewApplicationFieldRouter);
router.use("/getPendingApplications", getPendingApplicationsRouter);
router.use("/viewApplicationDetails", viewApplicationDetailsRouter);

export default router;
