import { Router } from "express";
import getPrefsCourseRouter from "./getPrefsCourse.ts";
import getInstructorPrefsRouter from "./getInstructorPrefs.ts";
import createRouter from "./create.ts";
import getRouter from "./get.ts";
import getAllRouter from "./getAll.ts";
import getStatusRouter from "./getStatus.ts";
import getInstructorListWithPrefRouter from "./getInstructorListWithPref.ts";
import sectionRouter from "./section/index.ts";
import instructorRouter from "./instructor/index.ts";

const router = Router();

router.use("/getPrefsCourse", getPrefsCourseRouter);
router.use("/getInstructorPrefs", getInstructorPrefsRouter);
router.use("/create", createRouter);
router.use("/getInstructorListWithPref", getInstructorListWithPrefRouter);
router.use("/get", getRouter);
router.use("/getAll", getAllRouter);
router.use("/getStatus", getStatusRouter);
router.use("/section", sectionRouter);
router.use("/instructor", instructorRouter);

export default router;
