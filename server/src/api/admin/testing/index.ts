import express from "express";
import startRouter from "./start.ts";
import endRouter from "./end.ts";

const router = express.Router();

router.use("/start", startRouter);
router.use("/end", endRouter);

export default router;
