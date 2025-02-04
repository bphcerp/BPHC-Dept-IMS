import express from "express";
import getPhDRecords from "./getPhDRecords.ts";
import updateExamDates from "./updateExamDates.ts";
import updateQualifyingExam from "./updateQualifyingExam.ts";

const router = express.Router();

router.use("/get-phd", getPhDRecords);
router.use("/update-exam-dates", updateExamDates);
router.use("/update-qualifying-exam", updateQualifyingExam);

export default router;
