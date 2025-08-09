import express from "express";
// import generateCourseworkForm from "./generateCourseworkForm.ts";
// import getPhdToGenerateQualifyingExamForm from "./getPhdToGenerateQualifyingExamForm.ts";
// import updatePassingDatesOfPhd from "./updatePassingDatesOfPhd.ts";
// import updateProposalDeadline from "../staff/updateProposalDeadline.ts";
// import getPhdDataOfWhoFilledApplicationForm from "./getPhdDataOfWhoFilledApplicationForm.ts";
// import getSuggestedDacMember from "./getSuggestedDacMember.ts";
// import suggestTwoBestDacMember from "./suggestTwoBestDacMember.ts";
// import updateFinalDac from "./updateFinalDac.ts";
// import updateQualifyingExamResultsOfAllStudents from "./updateQualifyingExamResultsOfAllStudents.ts";
// import getAllQualifyingExamForTheSem from "../staff/qualifyingExams.ts";
// import getAllSem from "../staff/getAllSem.ts";
// import updateQualifyingExamDeadline from "../staff/updateQualifyingExam.ts";
// import updateSemesterDates from "../staff/updateSem.ts";
// import getCurrentSemester from "../staff/getLatestSem.ts";
// import getPhdExamStatus from "./getPhdExamStatus.ts";
// import getQualificationDates from "./getQualificationDates.ts";
// import getDatesOfQeExam from "./getDatesOfQeExam.ts";
// import getSubAreasAndExaminer from "./getSubAreasAndExaminer.ts";
// import notifySupervisor from "./notifySupervisor.ts";
// import updateExaminer from "./updateExaminer.ts";
// import getSupervisorsWithStudents from "./getSupervisorsWithStudents.ts";
// import getQeTimeTable from "./getQeTimeTable.ts";
// import getPhdApplicationFormsAsZip from "./getPhdApplicationFormsAsZip.ts";
import getQualifyingExamApplications from "./getQualifyingExamApplications.ts";
import updateApplicationStatus from "./updateApplicationStatus.ts";
import getAvailableExams from "./getAvailableExams.ts";

const router = express.Router();

// router.use("/generateCourseworkForm", generateCourseworkForm);
// router.use("/updateQualifyingExamDeadline", updateQualifyingExamDeadline);
// router.use("/generateCourseworkForm", generateCourseworkForm);
// router.use(
//     "/getPhdToGenerateQualifyingExamForm",
//     getPhdToGenerateQualifyingExamForm
// );
// router.use("/updatePassingDatesOfPhd", updatePassingDatesOfPhd);
// router.use("/updateProposalDeadline", updateProposalDeadline);
// router.use(
//     "/getPhdDataOfWhoFilledApplicationForm",
//     getPhdDataOfWhoFilledApplicationForm
// );
// router.use("/getSuggestedDacMember", getSuggestedDacMember);
// router.use("/updateFinalDac", updateFinalDac);
// router.use("/suggestTwoBestDacMember", suggestTwoBestDacMember);
// router.use(
//     "/updateQualifyingExamResultsOfAllStudents",
//     updateQualifyingExamResultsOfAllStudents
// );
// router.use("/updateSemesterDates", updateSemesterDates);
// router.use("/getAllSem", getAllSem);
// router.use("/getAllQualifyingExamForTheSem", getAllQualifyingExamForTheSem);
// router.use("/getCurrentSemester", getCurrentSemester);
// router.use("/getPhdExamStatus", getPhdExamStatus);
// router.use("/getQualificationDates", getQualificationDates);
// router.use("/getDatesOfQeExam", getDatesOfQeExam);
// router.use("/getSubAreasAndExaminer", getSubAreasAndExaminer);
// router.use("/notifySupervisor", notifySupervisor);
// router.use("/updateExaminer", updateExaminer);
// router.use("/getSupervisorsWithStudents", getSupervisorsWithStudents);
// router.use("/getQeTimeTable", getQeTimeTable);
// router.use("/getPhdApplicationFormsAsZip", getPhdApplicationFormsAsZip);
router.use("/getQualifyingExamApplications", getQualifyingExamApplications);
router.use("/updateApplicationStatus", updateApplicationStatus);
router.use("/getAvailableExams", getAvailableExams);

export default router;
