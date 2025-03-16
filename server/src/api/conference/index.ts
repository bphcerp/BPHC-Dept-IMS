import express from "express";
import createApplicationRouter from "./createApplication.ts";
import getSubmittedApplicationsRouter from "./getSubmittedApplications.ts";

const router = express.Router();

router.use("/createApplication", createApplicationRouter);
router.use("/getSubmittedApplications", getSubmittedApplicationsRouter);

export default router;
