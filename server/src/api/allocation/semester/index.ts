import { Router } from "express";
import linkForm from "./linkForm.ts";
import unlinkForm from "./unlinkForm.ts";
import deleteSemester from "./delete.ts";
import createSemester from "./create.ts";
import getAllSemesters from "./getAll.ts";
import getLatestSemester from "./getLatest.ts";
import publishRouter from "./publish.ts";
import remindRouter from "./remind.ts";
import endLatestSemFormRouter from "./endForm.ts";
import toggleSemesterSummary from "./toggleSummary.ts";
import endSemesterAllocationRouter from "./endAllocation.ts";
import activateSemesterRouter from "./activateSemester.ts";
import getCompletedSemesterRouter from "./getCompletedSemester.ts";

const router = Router();

router.use("/linkForm", linkForm);
router.use("/unlinkForm", unlinkForm);
router.use("/delete", deleteSemester);
router.use("/create", createSemester);
router.use("/get", getAllSemesters);
router.use("/getLatest", getLatestSemester);
router.use("/publish", publishRouter);
router.use("/remind", remindRouter);
router.use("/endForm", endLatestSemFormRouter);
router.use("/toggleSummary", toggleSemesterSummary);
router.use("/end", endSemesterAllocationRouter);
router.use("/activate", activateSemesterRouter);
router.use("/getCompleted", getCompletedSemesterRouter);

export default router;
