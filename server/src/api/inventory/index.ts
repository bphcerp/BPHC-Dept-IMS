import express from "express";
import labRouter from "./labs/index.ts";

const router = express.Router();

router.use('/labs', labRouter)

export default router;
