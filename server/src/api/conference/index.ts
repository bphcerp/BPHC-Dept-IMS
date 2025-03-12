import express from "express";
import createApplicationRouter from "./createApplication.ts";
import getPendingApplicationsRouter from "./getPendingApplications.ts";

const router = express.Router();

router.use("/createApplication", createApplicationRouter);
router.use("/getPending", getPendingApplicationsRouter);

export default router;
