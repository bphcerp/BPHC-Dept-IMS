import express from 'express';
import studentRouter from './student/index.ts';
import drcMemberRouter from "./drcMember/index.ts"
import { authMiddleware } from '@/middleware/auth.ts';
const router  = express.Router();



router.use(authMiddleware);
router.use('/student', studentRouter);
router.use('/drcMember', drcMemberRouter);


export default router;