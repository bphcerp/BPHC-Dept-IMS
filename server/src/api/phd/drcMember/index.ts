import express from "express";
import getPhDRecords from "./getPhDRecords.ts";
import updateExamDates from "./updateExamDates.ts";
import updateQualifyingExam from "./updateQualifyingExam.ts";
import updateExamRouter from '../drcMember/updateExam.ts';
const router = express.Router();

router.use("/get-phd", getPhDRecords);
router.use("/update-exam-dates", updateExamDates);
router.use("/update-qualifying-exam", updateQualifyingExam);
router.use('/update-exam', updateExamRouter);

export default router;
