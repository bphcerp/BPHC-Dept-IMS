import express from "express";
import createApplicationRouter from "./createApplication.ts";

const router = express.Router();

router.use("/createApplication", createApplicationRouter);

export default router;
