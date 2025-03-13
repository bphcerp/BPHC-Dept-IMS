import express from "express";
import createApplicationRouter from "./createApplication.ts";
import finalizeApplicationRouter from "./finalizeApplication.ts";

const router = express.Router();

router.use("/createApplication", createApplicationRouter);
router.use("/finalize", finalizeApplicationRouter);

export default router;
