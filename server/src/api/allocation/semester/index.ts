import { Router } from "express";
import updateSemester from "./update.ts";
import deleteSemester from "./delete.ts";
import createSemester from "./create.ts";
import getAllSemesters from "./getAll.ts";
import getSemesterById from "./getById.ts";

const router = Router();

router.use("/update", updateSemester);
router.use("/delete", deleteSemester);
router.use("/create", createSemester);
router.use("/get", getAllSemesters);
router.use("/getById", getSemesterById);

export default router;