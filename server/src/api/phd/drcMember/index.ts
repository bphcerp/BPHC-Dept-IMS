import express from "express";
import getPhDRecords from "./getPhD.ts";
import updateExamDates from "./updateExamDates.ts";
import updateExamRouter from './updateQualifyingExamResultsOfAllStudents.ts';
import getFacultyDetails from "./getFacultyDetails.ts"
import assignSupervisor from "./assignSupervisor.ts"
import assignNotionalSupervisor from "./assignNotionalSupervisor.ts"
import getQualifyingExamForm from "./getQualifyingExamForm.ts"

import generateCourseworkForm from "./generateCourseworkForm.ts"
import updateQualifyingExamDeadline from "./updateQualifyingExamDeadline.ts";
import updateQePassFailStatus from "./updateQePassFailStatus.ts";
import getPhdThatFilledQualifyingExamApplicationForm from "./getPhdToGenerateQualifyingExamForm.ts";
import getPhdThatPassedRecently from "./getPhdThatPassedRecently.ts";
import updatePassingDatesOfPhd from "./updatePassingDatesOfPhd.ts";
import updateProposalDeadline from "./updateProposalDeadline.ts";
import getPhdDataToGeneratePhdQualifyingExamForm from "./getPhdDataOfWhoFilledApplicationForm.ts";
import getSuggestedDacMember from "./getSuggestedDacMember.ts";
import suggestTwoBestDacMember from "./suggestTwoBestDacMember.ts";
import updateFinalDac from "./updateFinalDac.ts";


const router = express.Router();

router.use("/getPhD", getPhDRecords);
router.use("/updateExamDates", updateExamDates);
router.use('/updateExam', updateExamRouter);
router.use('/getFacultyDetails', getFacultyDetails);
router.use('/assignSupervisor', assignSupervisor);
router.use('/assignNotionalSupervisor', assignNotionalSupervisor);
router.use('/getQualifyingExamForm', getQualifyingExamForm);
router.use('/generateCourseworkForm', generateCourseworkForm);
router.use('/updateQualifyingExamDeadline', updateQualifyingExamDeadline);
router.use('/updateQePassFailStatus', updateQePassFailStatus);
router.use('/generateCourseworkForm', generateCourseworkForm);
router.use('/getPhdThatFilledQualifyingExamApplicationForm', getPhdThatFilledQualifyingExamApplicationForm);
router.use('/updatePassingDatesOfPhd', updatePassingDatesOfPhd);
router.use('/getPhdThatPassedRecently', getPhdThatPassedRecently);
router.use('/updateProposalDeadline', updateProposalDeadline);
router.use('/getPhdDataToGeneratePhdQualifyingExamForm', getPhdDataToGeneratePhdQualifyingExamForm);
router.use('/getSuggestedDacMember', getSuggestedDacMember);
router.use('/updateFinalDac', updateFinalDac);
router.use('/suggestTwoBestDacMember', suggestTwoBestDacMember);

export default router;
