// server/src/api/phd/student/index.ts
import express from "express";
import { authMiddleware } from "@/middleware/auth.ts";

// Legacy APIs (updated/functional)
import getQualifyingExamStatus from "./getQualifyingExamStatus.ts";
import getProposalDeadline from "./getProposalDeadline.ts";
import uploadProposalDocuments from "./uploadProposalDocuments.ts";
import getQualifyingExamPassingDate from "./getQualifyingExamPassingDate.ts";
import getProposalStatus from "./getProposalStatus.ts";
import getGradeStatus from "./getGradeStatus.ts";
import getSubAreas from "./getSubAreas.ts";
import getProfileDetails from "./getProfileDetails.ts";

// New refactored APIs
import activeQualifyingExamRouter from "./active-qualifying-exam.ts";
import applicationsRouter from "./applications.ts";

const router = express.Router();

// Legacy APIs (keeping functional ones)
router.use("/getQualifyingExamStatus", getQualifyingExamStatus);
router.use("/getProposalDeadline", getProposalDeadline);
router.use("/uploadProposalDocuments", uploadProposalDocuments);
router.use("/getQualifyingExamPassingDate", getQualifyingExamPassingDate);
router.use("/getProposalStatus", getProposalStatus);
router.use("/getGradeStatus", getGradeStatus);
router.use("/getSubAreas", getSubAreas);
router.use("/getProfileDetails", getProfileDetails);

// New refactored APIs
router.use("/active-qualifying-exam", activeQualifyingExamRouter);
router.use("/applications", applicationsRouter);

router.use(authMiddleware);

export default router;
