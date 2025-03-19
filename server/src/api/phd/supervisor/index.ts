import express from "express";
import getSupervisedStudents from "./getSupervisedStudents.ts";
import suggestDacMember from "./suggestDacMember.ts";

const router = express.Router();
router.use("/getSupervisedStudents", getSupervisedStudents);
router.use("/suggestDacMember", suggestDacMember);
export default router;