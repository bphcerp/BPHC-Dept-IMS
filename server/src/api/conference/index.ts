import express from "express";
import createApplicationRouter from "./createApplication.ts";
import getFlowRouter from "./getFlow.ts";
import setFlowRouter from "./setFlow.ts";
import editApplicationFieldRouter from "./editApplication.ts";
import applicationsRouter from "./applications/index.ts";

const router = express.Router();

router.use("/createApplication", createApplicationRouter);
router.use("/edit", editApplicationFieldRouter);
router.use("/applications", applicationsRouter);
router.use("/getFlow", getFlowRouter);
router.use("/setFlow", setFlowRouter);

export default router;
