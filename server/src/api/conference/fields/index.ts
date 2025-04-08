import express from "express";
import reviewFieldRouter from "./review/[type][id].ts";

const router = express.Router();

router.use("/review", reviewFieldRouter);

export default router;
