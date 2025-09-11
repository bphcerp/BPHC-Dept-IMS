import express from "express";
import allocationRouter from "./allocation/index.ts";
import courseRouter from "./course/index.ts";
import semesterRouter from "./semester/index.ts";
import builderRouter from "./builder/index.ts";
import registerResponseRouter from "./response/index.ts";

const router = express.Router();

router.use("/allocation", allocationRouter);
router.use("/course", courseRouter);
router.use("/semester", semesterRouter);
router.use("/builder", builderRouter);
router.use("/response", registerResponseRouter);


export default router;