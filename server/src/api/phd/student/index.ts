import express from "express";
import { authMiddleware } from "@/middleware/auth.ts";
import getQualifyingExams from "./getQualifyingExams.ts";
import getQualifyingExamStatus from "./getQualifyingExamStatus.ts";
import uploadQeApplicationForm from "./uploadQeApplicationForm.ts";
import getSubAreas from "./getSubAreas.ts";
import getProposalDeadlines from "./getProposalDeadlines.ts";
import getProposalEligibility from "./getProposalEligibility.ts";
import getProfileDetails from "./getProfileDetails.ts";

const router = express.Router();

router.use("/getSubAreas", getSubAreas);
router.use("/getQualifyingExams", getQualifyingExams);
router.use("/getQualifyingExamStatus", getQualifyingExamStatus);
router.use("/uploadQeApplicationForm", uploadQeApplicationForm);
router.use("/getProposalDeadlines", getProposalDeadlines);
router.use("/getProposalEligibility", getProposalEligibility);
router.use("/getProfileDetails", getProfileDetails);

router.use(authMiddleware);

export default router;
