import express from "express";
import sendToDac from "./sendToDac.ts";

const router = express.Router();

router.use("/sendToDac", sendToDac);

export default router;
