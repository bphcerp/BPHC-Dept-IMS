import express from "express";
import sendRouter from "./send.ts";

const router = express.Router();
router.use("/send", sendRouter);
export default router;