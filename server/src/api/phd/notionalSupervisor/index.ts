import express from "express";
import getPhdRecords from "./getPhd.ts";
import updateCourseGrade from "./updateCourseGrade.ts";
import updateCourseDetails from "./updateCourseDetails.ts";
const router = express.Router();

router.use("/getPhd", getPhdRecords);
router.use("/updateCourseGrade", updateCourseGrade);
router.use("/updateCourseDetails", updateCourseDetails);

export default router;
