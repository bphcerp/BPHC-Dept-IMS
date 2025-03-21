import express from "express";
import updateExamDates from "./updateExamDates.ts";
import generateCourseworkForm from "./generateCourseworkForm.ts"
import getPhdToGenerateQualifyingExamForm from "./getPhdToGenerateQualifyingExamForm.ts";
import getPhdThatPassedRecently from "./getPhdThatPassedRecently.ts";
import updatePassingDatesOfPhd from "./updatePassingDatesOfPhd.ts";
import updateProposalDeadline from "./updateProposalDeadline.ts";
import getPhdDataOfWhoFilledApplicationForm from "./getPhdDataOfWhoFilledApplicationForm.ts";
import getSuggestedDacMember from "./getSuggestedDacMember.ts";
import suggestTwoBestDacMember from "./suggestTwoBestDacMember.ts";
import updateFinalDac from "./updateFinalDac.ts";
import updateQualifyingExamResultsOfAllStudents from "./updateQualifyingExamResultsOfAllStudents.ts";
import getAllQualifyingExamForTheSem from "./getAllQualifyingExamForTheSem.ts";
import getAllSem from "./getAllSem.ts";
import updateQualifyingExamDeadline from "./updateQualifyingExamDeadline.ts";
import updateSemesterDates from "./updateSemesterDates.ts";
import getCurrentSemester from "./getCurrentSemester.ts";


const router = express.Router();


router.use("/updateExamDates", updateExamDates);
router.use('/generateCourseworkForm', generateCourseworkForm);
router.use('/updateQualifyingExamDeadline', updateQualifyingExamDeadline);
router.use('/generateCourseworkForm', generateCourseworkForm);
router.use('/getPhdToGenerateQualifyingExamForm', getPhdToGenerateQualifyingExamForm);
router.use('/updatePassingDatesOfPhd', updatePassingDatesOfPhd);
router.use('/getPhdThatPassedRecently', getPhdThatPassedRecently);
router.use('/updateProposalDeadline', updateProposalDeadline);
router.use('/getPhdDataOfWhoFilledApplicationForm', getPhdDataOfWhoFilledApplicationForm);
router.use('/getSuggestedDacMember', getSuggestedDacMember);
router.use('/updateFinalDac', updateFinalDac);
router.use('/suggestTwoBestDacMember', suggestTwoBestDacMember);
router.use('/updateQualifyingExamResultsOfAllStudents', updateQualifyingExamResultsOfAllStudents);
router.use('/updateSemesterDates', updateSemesterDates);
router.use('/getAllSem', getAllSem);
router.use('/getAllQualifyingExamForTheSem', getAllQualifyingExamForTheSem);
router.use('/getCurrentSemester', getCurrentSemester);

export default router;
