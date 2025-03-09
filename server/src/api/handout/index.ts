import express from "express";
import createApplication from "./createApplication.ts";
import getAllPendingAppDCA from "./getAllPendingAppDCA.ts";

const router = express.Router();

router.use("/create", createApplication);
router.use("/getAllApplicationsDCA", getAllPendingAppDCA);

export default router;
