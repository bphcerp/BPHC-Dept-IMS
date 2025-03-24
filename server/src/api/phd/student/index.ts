import express from "express";
import { authMiddleware } from "@/middleware/auth.ts";
import checkExamStatus from "./checkExamStatus.ts";
import getQualifyingExamDeadLine from "./getQualifyingExamDeadLine.ts";
import getProposalDeadline from "./getProposalDeadline.ts";
import getQualifyingExamStatus from "./getQualifyingExamStatus.ts";
import uploadQeApplicationForm from "./uploadQeApplicationForm.ts";
import uploadProposalDocuments from "./uploadProposalDocuments.ts";
import getQualifyingExamPassingDate from "./getQualifyingExamPassingDate.ts";
import getDocumentStatus from "./getDocumentStatus.ts";
const router = express.Router();

router.use("/checkExamStatus", checkExamStatus);
router.use("/getQualifyingExamDeadLine", getQualifyingExamDeadLine);
router.use("/getQualifyingExamStatus", getQualifyingExamStatus);
router.use("/getProposalDeadline", getProposalDeadline);
router.use("/uploadQeApplicationForm", uploadQeApplicationForm);
router.use("/uploadProposalDocuments", uploadProposalDocuments);
router.use("/getQualifyingExamPassingDate", getQualifyingExamPassingDate);
router.use("/getDocumentStatus", getDocumentStatus);

router.use(authMiddleware);

export default router;
