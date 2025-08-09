// server/src/api/phd/supervisor/index.ts
import express from "express";

// Legacy APIs (keeping functional ones)
import getSupervisedStudents from "./getSupervisedStudents.ts";
import suggestDacMembers from "./suggestDacMembers.ts";
import reviewProposalDocument from "./reviewProposalDocument.ts";
import getSubAreas from "./getSubAreas.ts";
import getStudents from "./getStudents.ts";

// New refactored APIs
import suggestionsRouter from "./suggestions.ts";

const router = express.Router();

// Legacy APIs
router.use("/getSupervisedStudents", getSupervisedStudents);
router.use("/suggestDacMembers", suggestDacMembers);
router.use("/reviewProposalDocument", reviewProposalDocument);
router.use("/getSubAreas", getSubAreas);
router.use("/getStudents", getStudents);

// New refactored APIs
router.use("/", suggestionsRouter);

export default router;
