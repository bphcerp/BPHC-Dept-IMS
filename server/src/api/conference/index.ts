import express from "express";
import createApplicationRouter from "./createApplication.ts";
import finalizeApplicationRouter from "./finalizeApplication.ts";
import reviewApplicationFieldRouter from "./reviewApplicationField.ts";
import editApplicationFieldRouter from "./editApplicationField.ts";
import applicationsRouter from "./applications/index.ts";
import fieldsRouter from "./fields/index.ts";

const router = express.Router();

router.use("/createApplication", createApplicationRouter);
router.use("/edit", editApplicationFieldRouter);
router.use("/reviewApplicationField", reviewApplicationFieldRouter);
router.use("/finalizeApplication", finalizeApplicationRouter);
router.use("/applications", applicationsRouter);
router.use("/fields", fieldsRouter);

export default router;
