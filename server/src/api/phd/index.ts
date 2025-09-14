import express from "express";
import studentRouter from "./student/index.ts";
import drcMemberRouter from "./drcMember/index.ts";
import staffRouter from "./staff/index.ts";
import supervisorRouter from "./supervisor/index.ts";
import examinerRouter from "./examiner/index.ts";
import proposalRouter from "./proposal/index.ts";
import getSubAreas from "./getSubAreas.ts";
const router = express.Router();

router.use("/student", studentRouter);
router.use("/drcMember", drcMemberRouter);
router.use("/staff", staffRouter);
router.use("/supervisor", supervisorRouter);
router.use("/proposal", proposalRouter);
router.use("/getSubAreas", getSubAreas);
router.use("/examiner", examinerRouter);

export default router;
