import express from "express";
import assignmentsRouter from "./assignments.ts";
import acceptAssignment from "./acceptAssignment.ts";
import rejectAssignment from "./rejectAssignment.ts";

const router = express.Router();

router.use("/assignments", assignmentsRouter);
router.use("/acceptAssignment", acceptAssignment);
router.use("/rejectAssignment", rejectAssignment);

export default router;
