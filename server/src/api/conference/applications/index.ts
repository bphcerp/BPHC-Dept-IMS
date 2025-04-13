import express from "express";
import myApplicationsRouter from "./my.ts";
import pendingApplicationsRouter from "./pending.ts";
import viewApplicationRouter from "./view/[id].ts";
// import reviewMemberRouter from "./reviewMember/[id].ts";
// import reviewConvenerRouter from "./reviewConvener/[id].ts";
// import reviewHodRouter from "./reviewHod/[id].ts";

const router = express.Router();

router.use("/my", myApplicationsRouter);
router.use("/pending", pendingApplicationsRouter);
router.use("/view", viewApplicationRouter);
// router.use("/reviewConvener", reviewConvenerRouter);
// router.use("/reviewHod", reviewHodRouter);
// router.use("/reviewMember", reviewMemberRouter);

export default router;
