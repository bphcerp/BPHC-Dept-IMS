import express from 'express';
import studentRouter from './student/index.ts';
import drcMemberRouter from "./drcMember/index.ts"
const router  = express.Router();


router.use('/student', studentRouter);
router.use('/drcMember', drcMemberRouter);


export default router;