import express from "express";
import getAllSem from "./getAllSem.ts";
import updateSemesterDates from "./updateSemesterDates.ts";
import getAllQualifyingExamForTheSem from "./getAllQualifyingExamForTheSem.ts";
import getCurrentSemester from "./getCurrentSemester.ts";
import updateProposalDeadline from "./updateProposalDeadline.ts";
import updateQualifyingExamDeadline from "./updateQualifyingExamDeadline.ts";
import getSubAreas from "./getSubAreas.ts";
import updateSubAreas from "./updateSubAreas.ts";
import deleteSubArea from "./deleteSubArea.ts";
import notifyAllUsers from "./notifyAllUsers.ts";

const router = express.Router();
router.use("/getAllSem", getAllSem);
router.use("/getAllQualifyingExamForTheSem", getAllQualifyingExamForTheSem);
router.use("/updateSemesterDates", updateSemesterDates);
router.use("/getCurrentSemester", getCurrentSemester);
router.use("/updateProposalDeadline", updateProposalDeadline);
router.use("/updateQualifyingExamDeadline", updateQualifyingExamDeadline);
router.use("/deleteSubArea", deleteSubArea);
router.use("/updateSubAreas", updateSubAreas);
router.use("/getSubAreas", getSubAreas);
router.use("/notifyAllUsers", notifyAllUsers);

export default router;
