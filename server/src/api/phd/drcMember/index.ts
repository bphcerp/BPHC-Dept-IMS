import express from "express";
import getQualifyingExamApplications from "./getQualifyingExamApplications.ts";
import updateApplicationStatus from "./updateApplicationStatus.ts";
import getAvailableExams from "./getAvailableExams.ts";
import getVerifiedApplications from "./getVerifiedApplications.ts";
import generateForms from "./generateForms.ts";
import notifySupervisor from "./notifySupervisor.ts";
import getExaminerSuggestions from "./getExaminerSuggestions.ts";
import assignExaminers from "./assignExaminers.ts";
import notifyExaminers from "./notifyExaminers.ts";
import submitResult from "./submitResult.ts";
import setQualificationDate from "./setQualificationDate.ts";
import updateExaminerCount from "./updateExaminerCount.ts";

const router = express.Router();

router.use("/getQualifyingExamApplications", getQualifyingExamApplications);
router.use("/updateApplicationStatus", updateApplicationStatus);
router.use("/getAvailableExams", getAvailableExams);
router.use("/getVerifiedApplications", getVerifiedApplications);
router.use("/generateForms", generateForms);
router.use("/notifySupervisor", notifySupervisor);
router.use("/getExaminerSuggestions", getExaminerSuggestions);
router.use("/assignExaminers", assignExaminers);
router.use("/notifyExaminers", notifyExaminers);
router.use("/submitResult", submitResult);
router.use("/setQualificationDate", setQualificationDate);
router.use("/updateExaminerCount", updateExaminerCount);
export default router;