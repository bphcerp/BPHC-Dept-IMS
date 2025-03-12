import express from "express";
import createApplicationRouter from "./createApplication.ts";
import approveApplicationRouter from "./approveApplication.ts";

const router = express.Router();

router.use("/createApplication", createApplicationRouter);
router.use("/approve", approveApplicationRouter);

export default router;
