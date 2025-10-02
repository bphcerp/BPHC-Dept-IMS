import { Router } from "express";
import getPrefFacultyRouter from "./getPrefFaculty.ts";
import getFacultyPrefsRouter from "./getFacultyPrefs.ts";
import createRouter from "./create.ts";
import getRouter from "./get.ts";
import getAllRouter from "./getAll.ts";
import getInstructorListWithPrefRouter from "./getInstructorListWithPref.ts";
import sectionRouter from "./section/index.ts";
import instructorRouter from "./instructor/index.ts";

const router = Router();

router.use("/getPreferredFaculty", getPrefFacultyRouter);
router.use("/getFacultyPrefs", getFacultyPrefsRouter);
router.use("/create", createRouter);
router.use("/getInstructorListWithPref", getInstructorListWithPrefRouter);
router.use("/get", getRouter);
router.use("/getAll", getAllRouter);
router.use("/section", sectionRouter);
router.use("/instructor", instructorRouter);

export default router;
