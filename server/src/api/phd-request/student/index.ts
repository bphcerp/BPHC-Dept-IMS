// server/src/api/phd-request/student/index.ts
import express from "express";
import submitFinalThesisRouter from "./submitFinalThesis.ts";

const router = express.Router();

router.use("/submit-final-thesis", submitFinalThesisRouter);

export default router;
