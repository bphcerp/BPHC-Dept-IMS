import express from "express";
import myApplicationsRouter from "./my.ts";
import pendingApplicationsRouter from "./pending.ts";
import viewApplicationRouter from "./view/[id].ts";
import reviewApplicationRouter from "./review/[id].ts";

const router = express.Router();

router.use("/my", myApplicationsRouter);
router.use("/pending", pendingApplicationsRouter);
router.use("/view", viewApplicationRouter);
router.use("/review", reviewApplicationRouter);

export default router;
