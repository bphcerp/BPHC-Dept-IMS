import express from "express";
import getQualifyingExamApplications from "./getQualifyingExamApplications.ts";
import updateApplicationStatus from "./updateApplicationStatus.ts";
import getAvailableExams from "./getAvailableExams.ts";
import getVerifiedApplications from "./getVerifiedApplications.ts";
import generateForms from "./generateForms.ts";

const router = express.Router();

router.use("/getQualifyingExamApplications", getQualifyingExamApplications);
router.use("/updateApplicationStatus", updateApplicationStatus);
router.use("/getAvailableExams", getAvailableExams);
router.use("/getVerifiedApplications", getVerifiedApplications);
router.use("/generateForms", generateForms);

export default router;
