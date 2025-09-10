import express from "express";
import startRouter from "./start.ts";

const router = express.Router();

router.use("/start", startRouter);

export default router;
