import express from "express";
import getSupervisedStudents from "./getSupervisedStudents.ts";
import suggestDacMembers from "./suggestDacMembers.ts";
import reviewProposalDocument from "./reviewProposalDocument.ts";
import updateSuggestedExaminer from "./updateSuggestedExaminer.ts";
import getSubAreas from "./getSubAreas.ts";
import getStudents from "./getStudents.ts";

const router = express.Router();
router.use("/getSupervisedStudents", getSupervisedStudents);
router.use("/suggestDacMembers", suggestDacMembers);
router.use("/reviewProposalDocument", reviewProposalDocument);
router.use("/getSubAreas", getSubAreas);
router.use("/updateSuggestedExaminer", updateSuggestedExaminer);
router.use("/getStudents", getStudents);
export default router;