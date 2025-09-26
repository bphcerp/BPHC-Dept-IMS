// server/src/api/phd-request/drcConvener/index.ts
import express from "express";
import getRequestsRouter from "./getRequests.ts";
import reviewRequestRouter from "./reviewRequest.ts";

const router = express.Router();

router.use("/requests", getRequestsRouter);
router.use("/review", reviewRequestRouter);

export default router;
