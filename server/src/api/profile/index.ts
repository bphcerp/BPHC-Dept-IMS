import express from "express";
import signatureRouter from "./signature/signature.ts";

const router = express.Router();

router.use("/signature", signatureRouter);

export default router;