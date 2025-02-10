import express from "express";
import getPhdRecords from "./getPhd.ts";
import updateCourseGrade from "./updateCourseGrade.ts";
const router = express.Router();

router.use("/getPhd", getPhdRecords);
router.use("/updateCourseGrade", updateCourseGrade);

export default router;
