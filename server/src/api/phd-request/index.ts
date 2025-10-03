import express from "express";
import supervisorRouter from "./supervisor/index.ts";
import studentRouter from "./student/index.ts";
import drcConvenerRouter from "./drcConvener/index.ts";
import drcMemberRouter from "./drcMember/index.ts";
import hodRouter from "./hod/index.ts";
import detailsRouter from "./details.ts";
import historyRouter from "./history.ts";
import staffRouter from "./staff/index.ts";
import downloadPackagesRouter from "./downloadPackages.ts";

const router = express.Router();

router.use("/supervisor", supervisorRouter);
router.use("/student", studentRouter);
router.use("/drc-convener", drcConvenerRouter);
router.use("/drc-member", drcMemberRouter);
router.use("/hod", hodRouter);
router.use("/details", detailsRouter);
router.use("/history", historyRouter);
router.use("/staff", staffRouter);
router.use("/download-packages", downloadPackagesRouter);

export default router;
