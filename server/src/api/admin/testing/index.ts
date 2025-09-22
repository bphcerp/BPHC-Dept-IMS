import express from "express";
import startRouter from "./start.ts";
import endRouter from "./end.ts";
import editRouter from "./edit.ts";
import statusRouter from "./status.ts";

const router = express.Router();

router.use("/status", statusRouter);
router.use("/start", startRouter);
router.use("/end", endRouter);
router.use("/edit", editRouter);

export default router;
