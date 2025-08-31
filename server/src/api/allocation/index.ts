import express from "express";
import allocationRouter from "./allocation/index.ts";
import courseRouter from "./course/index.ts";
import semesterRouter from "./semester/index.ts";


const router = express.Router();

router.use("/allocation", allocationRouter);
router.use("/course", courseRouter);
router.use("/semester", semesterRouter);


export default router;