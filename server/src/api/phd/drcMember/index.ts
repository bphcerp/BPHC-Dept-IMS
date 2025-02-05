import express from "express";
import getPhDRecords from "./getPhD.ts";
import updateExamDates from "./updateExamDates.ts";
import updateExamRouter from './updateExam.ts';
import getFacultyDetails from "./getFacultyDetails.ts"
import assignSuperviosr from "./assignSupervisor.ts"
import assignNotionalSupervisor from "./assignNotionalSupervisor.ts"
const router = express.Router();

router.use("/getPhD", getPhDRecords);
router.use("/updateExamDates", updateExamDates);
router.use('/updateExam', updateExamRouter);
router.use('/getFacultyDetails', getFacultyDetails);
router.use('/assignSupervisor', assignSuperviosr);
router.use('/assignNotionalSupervisor', assignNotionalSupervisor);

export default router;
