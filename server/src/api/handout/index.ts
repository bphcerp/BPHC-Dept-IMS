import express from "express";
import createApplication from "./createApplication.ts";
import getAllPendingAppFaculty from "./getAllPendingAppFaculty.ts";
const router = express.Router();

router.use("/create", createApplication);
router.use("/getAllApplicationsFaculty", getAllPendingAppFaculty);

export default router;
