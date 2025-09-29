import express from "express";
import studentRouter from "./student/index.ts";
import supervisorRouter from "./supervisor/index.ts";
import drConvenerRouter from "./drcConvener/index.ts";
import dacMemberRouter from "./dacMember/index.ts";
import getProposalSemestersRouter from "./getProposalSemesters.ts";
import getFacultyList from "./getFacultyList.ts";

const router = express.Router();

router.use("/student", studentRouter);
router.use("/supervisor", supervisorRouter);
router.use("/drcConvener", drConvenerRouter);
router.use("/dacMember", dacMemberRouter);
router.use("/getProposalSemesters", getProposalSemestersRouter); 
router.use("/getFacultyList", getFacultyList); 

export default router;
