import express from "express";
import uploadExcel from "./uploadExcel.ts";
import exportExcel from "./exportExcel.ts";
import supervisorRouter from "./supervisor/index.ts";
import publicRouter from "./public/index.ts";

const router = express.Router();

router.use("/upload", uploadExcel);
router.use("/export", exportExcel);
router.use("/supervisor", supervisorRouter);
router.use("/public", publicRouter);

export default router;
