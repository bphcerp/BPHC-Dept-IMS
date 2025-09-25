import { Router } from "express";
import getPrefFacultyRouter from "./getPrefFaculty.ts";
import createRouter from "./create.ts";
import getRouter from "./get.ts";
import getInstructorListRouter from "./getInstructorList.ts";
import sectionRouter from "./section/index.ts";

const router = Router();

router.use("/getPreferredFaculty", getPrefFacultyRouter);
router.use("/create", createRouter);
router.use("/getInstructorList", getInstructorListRouter);
router.use("/get", getRouter);
router.use("/section", sectionRouter);

export default router;
