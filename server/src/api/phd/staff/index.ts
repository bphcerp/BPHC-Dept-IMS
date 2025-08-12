import express from "express";
import getAllSem from "./getAllSem.ts";
import updateSem from "./updateSem.ts";
import deleteSem from "./deleteSem.ts";
import qualifyingExams from "./qualifyingExams.ts";
import getLatestSem from "./getLatestSem.ts";
import updateQualifyingExam from "./updateQualifyingExam.ts";
import insertSubArea from "./insertSubArea.ts";
import deleteSubArea from "./deleteSubArea.ts";
import notifyAllUsers from "./notifyAllUsers.ts";

const router = express.Router();

router.use("/getAllSem", getAllSem);
router.use("/updateSem", updateSem);
router.use("/deleteSem", deleteSem);
router.use("/getLatestSem", getLatestSem);

router.use("/qualifyingExams", qualifyingExams);
router.use("/updateQualifyingExam", updateQualifyingExam);

router.use("/insertSubArea", insertSubArea);
router.use("/deleteSubArea", deleteSubArea);

router.use("/notifyAllUsers", notifyAllUsers);

export default router;
