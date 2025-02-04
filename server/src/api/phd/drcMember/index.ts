import express from "express";
import getPhDRecords from "./getPhDRecords.ts";
import updateExamDates from "./updateExamDates.ts";
import updateExamRouter from './updateExam.ts';
import getFacultyDetails from "./getFacultyDetails.ts"
const router = express.Router();

router.use("/get-phd", getPhDRecords);
router.use("/update-exam-dates", updateExamDates);
router.use('/update-exam', updateExamRouter);
router.use('/get-faculty-details', getFacultyDetails);

export default router;
