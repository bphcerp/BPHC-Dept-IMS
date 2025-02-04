import express from 'express';
import updateExamRouter from './updateExam.ts';
import { authMiddleware } from '@/middleware/auth.ts';
import inputDetails from './inputDetails.ts';

const router  = express.Router();

router.use('/update-exam', updateExamRouter);
router.use("/input-details", inputDetails);

router.use(authMiddleware);


export default router;