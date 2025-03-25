import express from "express";
import getAllSem from "./getAllSem.ts";
import updateSemesterDates from "./updateSemesterDates.ts";
import getAllQualifyingExamForTheSem from "./getAllQualifyingExamForTheSem.ts";
import getCurrentSemester from "./getCurrentSemester.ts";
import updateProposalDeadline from "./updateProposalDeadline.ts";
import updateQualifyingExamDeadline from "./updateQualifyingExamDeadline.ts";

const router = express.Router();
router.use("/getAllSem", getAllSem);
router.use("/getAllQualifyingExamForTheSem", getAllQualifyingExamForTheSem);
router.use("/updateSemesterDates", updateSemesterDates);
router.use("/getCurrentSemester", getCurrentSemester);
router.use("/updateProposalDeadline", updateProposalDeadline);
router.use("/updateQualifyingExamDeadline", updateQualifyingExamDeadline);

export default router;