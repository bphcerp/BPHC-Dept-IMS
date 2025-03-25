import express from "express";
import getCoSupervisedStudents from "./getCoSupervisedStudents.ts";

const router = express.Router();
router.use("/getCoSupervisedStudents", getCoSupervisedStudents);
export default router;