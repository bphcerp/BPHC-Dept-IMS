import express from 'express';
import { authMiddleware } from '@/middleware/auth.ts';
import inputDetails from './inputDetails.ts';

const router  = express.Router();

router.use("/input-details", inputDetails);

router.use(authMiddleware);


export default router;