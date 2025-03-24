import express from "express";
import getSupervisedStudents from "./getSupervisedStudents.ts";
import suggestDacMembers from "./suggestDacMembers.ts";
import reviewProposalDocument from "./reviewProposalDocument.ts";

const router = express.Router();
router.use("/getSupervisedStudents", getSupervisedStudents);
router.use("/suggestDacMembers", suggestDacMembers);
router.use("/reviewProposalDocument", reviewProposalDocument);
export default router;