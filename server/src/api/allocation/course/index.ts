import { Router } from "express";
import createCourse from "./create.ts";
import getCourses from "./get.ts";
import getCourseByCode from "./getCourseByCode.ts";
import updateCourse from "./update.ts";
import deleteCourse from "./delete.ts";

const router = Router();

router.use("/create", createCourse);
router.use("/get", getCourses);
router.use("/getCourseByCode", getCourseByCode);
router.use("/update", updateCourse);
router.use("/delete", deleteCourse);

export default router;