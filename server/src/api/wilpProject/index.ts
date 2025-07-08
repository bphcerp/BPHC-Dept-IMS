import express from "express";
import upload from "./upload.ts";

const router = express.Router();

router.use("/upload", upload);

export default router;
