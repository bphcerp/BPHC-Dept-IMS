import detailsRouter from "./details.ts";
import { Router } from "express";

const router = Router();

router.use("/details", detailsRouter);

export default router;
