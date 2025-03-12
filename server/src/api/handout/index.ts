import express from "express";
import createApplication from "./createApplication.ts";
import getAllPendingAppFaculty from "./getAllPendingAppFaculty.ts";
import getApplicationFaculty from "./getApplicationFaculty.ts";
import getAllApplicationsDCA from "./getAllApplicationsDCA.ts"
const router = express.Router();


router.use("/create", createApplication);
router.use("/getApplicationFaculty", getApplicationFaculty);
router.use("/getAllApplicationsDCA", getAllApplicationsDCA);
router.use("/getAllApplicationsFaculty", getAllPendingAppFaculty);

export default router;
