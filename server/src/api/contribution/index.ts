import { Router } from "express";
import contributionRouter from "./contribution.router";

const router = Router();

router.use(contributionRouter);

export default router;