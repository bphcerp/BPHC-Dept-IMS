import express from 'express';
import { authMiddleware } from '@/middleware/auth.ts';
import inputDetails from './inputDetails.ts';
import checkExamStatus from "./checkExamStatus.ts"
const router  = express.Router();

router.use("/input-details", inputDetails);
router.use("/check-exam-status", checkExamStatus);

router.use(authMiddleware);


export default router;