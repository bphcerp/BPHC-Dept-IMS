import express from "express";
import getSupervisedStudents from "./getSupervisedStudents.ts";
import suggestDacMembers from "./suggestDacMembers.ts";

const router = express.Router();
router.use("/getSupervisedStudents", getSupervisedStudents);
router.use("/suggestDacMembers", suggestDacMembers);
export default router;