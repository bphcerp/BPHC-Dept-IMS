import express from "express";
import createQpReviewRouter from "./createQpReviewRequest.ts";

const router = express.Router();

router.use("/createQpRequest", createQpReviewRouter);

export default router;
