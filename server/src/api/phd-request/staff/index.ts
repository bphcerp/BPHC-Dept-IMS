import express from "express";
import getAllRequestsRouter from "./getAllRequests.ts";

const router = express.Router();
router.use("/getAllRequests", getAllRequestsRouter);

export default router;
