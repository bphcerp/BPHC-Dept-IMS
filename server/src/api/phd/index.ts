import express from 'express';
import studentRouter from './student/index.ts';
import drcMemberRouter from "./drcMember/index.ts";
import notifsRouter from "./notifs/index.ts";
const router  = express.Router();


router.use('/student', studentRouter);
router.use('/drcMember', drcMemberRouter);
router.use('/notifs', notifsRouter);

export default router;