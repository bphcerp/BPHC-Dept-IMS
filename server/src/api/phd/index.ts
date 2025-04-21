import express from "express";
import studentRouter from "./student/index.ts";
import drcMemberRouter from "./drcMember/index.ts";
import notifsRouter from "./notifs/index.ts";
import notionalSupervisorRouter from "./notionalSupervisor/index.ts";
import supervisorRouter from "./supervisor/index.ts";
import cosupervisorRouter from "./coSupervisor/index.ts";
import staffRouter from "./staff/index.ts";
const router = express.Router();

router.use("/student", studentRouter);
router.use("/drcMember", drcMemberRouter);
router.use("/notifs", notifsRouter);
router.use("/notionalSupervisor", notionalSupervisorRouter);
router.use("/supervisor", supervisorRouter);
router.use("/cosupervisor", cosupervisorRouter);
router.use("/staff", staffRouter);

export default router;
