import express from "express";
import createApplication from "./createApplication.ts";
import getApplicationFaculty from "./getApplicationFaculty.ts";
const router = express.Router();

router.use("/create", createApplication);
router.use("/getApplicationFaculty", getApplicationFaculty);
router.use("/getAllApplicationsDCA", getAllApplicationsDCA);

export default router;
