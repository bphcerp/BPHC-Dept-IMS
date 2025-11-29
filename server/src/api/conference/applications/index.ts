import express from "express";
import myApplicationsRouter from "./my.ts";
import pendingApplicationsRouter from "./pending.ts";
import viewApplicationRouter from "./view/[id].ts";
import reviewMemberRouter from "./reviewMember/[id].ts";
import reviewConvenerRouter from "./reviewConvener/[id].ts";
import reviewHodRouter from "./reviewHod/[id].ts";
import generateFormRouter from "./generateForm/[id].ts";
import getMembersRouter from "./getMembers/[id].ts";
import setMembersRouter from "./setMembers/[id].ts";
import requestActionRouter from "./requestAction/[id].ts";
import handleRequestRouter from "./handleRequest/[id].ts";

const router = express.Router();

router.use("/my", myApplicationsRouter);
router.use("/pending", pendingApplicationsRouter);
router.use("/view", viewApplicationRouter);
router.use("/reviewConvener", reviewConvenerRouter);
router.use("/reviewHod", reviewHodRouter);
router.use("/reviewMember", reviewMemberRouter);
router.use("/generateForm", generateFormRouter);
router.use("/getMembers", getMembersRouter);
router.use("/setMembers", setMembersRouter);
router.use("/requestAction", requestActionRouter);
router.use("/handleRequest", handleRequestRouter);

export default router;
