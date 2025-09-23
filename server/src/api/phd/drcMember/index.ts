import express from "express";
import getQualifyingExamApplications from "./getQualifyingExamApplications.ts";
import updateApplicationStatus from "./updateApplicationStatus.ts";
import getAvailableExams from "./getAvailableExams.ts";
import getVerifiedApplications from "./getVerifiedApplications.ts";
import generateForms from "./generateForms.ts";
import requestExaminerSuggestions from "./requestExaminerSuggestions.ts";
import assignExaminers from "./assignExaminers.ts";
import submitResult from "./submitResult.ts";
import setQualificationDate from "./setQualificationDate.ts";
import updateExaminerCount from "./updateExaminerCount.ts";
import updateQpSubmissionStatus from "./updateQpSubmissionStatus.ts";
import notifyExaminer from "./notifyExaminer.ts";
import getTimetable from "./getTimetable.ts";
import updateTimetable from "./updateTimetable.ts";
import optimizeTimetable from "./optimizeTimetable.ts";
import generateTimetablePdf from "./generateTimetablePdf.ts";
import generateQEApplicationForm from "./generateQEApplicationForm.ts"

const router = express.Router();

router.use("/getQualifyingExamApplications", getQualifyingExamApplications);
router.use("/updateApplicationStatus", updateApplicationStatus);
router.use("/getAvailableExams", getAvailableExams);
router.use("/getVerifiedApplications", getVerifiedApplications);
router.use("/generateForms", generateForms);
router.use("/generateApplicationForm", generateQEApplicationForm);
router.use("/requestExaminerSuggestions", requestExaminerSuggestions);
router.use("/assignExaminers", assignExaminers);
router.use("/submitResult", submitResult);
router.use("/setQualificationDate", setQualificationDate);
router.use("/updateExaminerCount", updateExaminerCount);
router.use("/updateQpSubmissionStatus", updateQpSubmissionStatus);
router.use("/notifyExaminer", notifyExaminer);
router.use("/timetable", getTimetable);
router.use("/timetable", updateTimetable);
router.use("/optimizeTimetable", optimizeTimetable);
router.use("/generateTimetablePdf", generateTimetablePdf);

export default router;
