import express from 'express';
import studentRouter from './student/index.ts';
import drcMemberRouter from "./drcMember/index.ts";
import notifsRouter from "./notifs/index.ts";
import notionalSupervisorRouter from "./notionalSupervisor/index.ts"
const router  = express.Router();


router.use('/student', studentRouter);
router.use('/drcMember', drcMemberRouter);
router.use('/notifs', notifsRouter);
router.use('/notionalSupervisor', notionalSupervisorRouter);

export default router;