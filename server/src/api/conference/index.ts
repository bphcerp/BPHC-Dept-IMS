import express from "express";
import createApplicationRouter from "./createApplication.ts";
import editApplicationFieldRouter from "./editApplication.ts";
import applicationsRouter from "./applications/index.ts";

const router = express.Router();

router.use("/createApplication", createApplicationRouter);
router.use("/edit", editApplicationFieldRouter);
router.use("/applications", applicationsRouter);

export default router;
