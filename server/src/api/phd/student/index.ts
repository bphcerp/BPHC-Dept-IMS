import express from "express";
import { authMiddleware } from "@/middleware/auth.ts";
import getQualifyingExams from "./getQualifyingExams.ts";
import getQualifyingExamStatus from "./getQualifyingExamStatus.ts";
import uploadQeApplicationForm from "./uploadQeApplicationForm.ts";
import getSubAreas from "./getSubAreas.ts";

const router = express.Router();

router.use("/getSubAreas", getSubAreas);
router.use("/getQualifyingExams", getQualifyingExams);
router.use("/getQualifyingExamStatus", getQualifyingExamStatus);
router.use("/uploadQeApplicationForm", uploadQeApplicationForm);

router.use(authMiddleware);

export default router;
