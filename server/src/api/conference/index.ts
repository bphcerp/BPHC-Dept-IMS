import express from "express";
import createApplicationRouter from "./createApplication.ts";
import finalizeApplicationRouter from "./finalizeApplication.ts";
import viewOwnApplicationDetailsRouter from "./viewOwnApplicationDetails.ts";
import reviewApplicationFieldRouter from "./reviewApplicationField.ts";
import editApplicationFieldRouter from "./editApplicationField.ts";
import applicationsRouter from "./applications/index.ts";

const router = express.Router();

router.use("/createApplication", createApplicationRouter);
router.use("/edit", editApplicationFieldRouter);
router.use("/reviewApplicationField", reviewApplicationFieldRouter);
router.use("/finalizeApplication", finalizeApplicationRouter);
router.use("/viewOwnApplicationDetails", viewOwnApplicationDetailsRouter);
router.use("/applications", applicationsRouter);

export default router;
