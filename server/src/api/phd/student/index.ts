import express from 'express';
import { authMiddleware } from '@/middleware/auth.ts';
import inputDetails from './inputDetails.ts';
import checkExamStatus from "./checkExamStatus.ts"
import getQualifyingExam from './getQualifyingExam.ts';
const router  = express.Router();

router.use("/inputDetails", inputDetails);
router.use("/checkExamStatus", checkExamStatus);
router.use("/getQualifyingExam", getQualifyingExam);

router.use(authMiddleware);


export default router;