import express from "express";
import studentRouter from "./student/index.ts";
import supervisorRouter from "./supervisor/index.ts";
import drConvenerRouter from "./drcConvener/index.ts";
import coSupervisorRouter from "./coSupervisor/index.ts";

const router = express.Router();

router.use("/student", studentRouter);
router.use("/supervisor", supervisorRouter);
router.use("/drcConvener", drConvenerRouter);
router.use("/coSupervisor", coSupervisorRouter);

export default router;
