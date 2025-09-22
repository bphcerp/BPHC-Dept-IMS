import { Router } from "express";
import updateSemester from "./update.ts";
import linkForm from "./linkForm.ts";
import deleteSemester from "./delete.ts";
import createSemester from "./create.ts";
import getAllSemesters from "./getAll.ts";
import getLatestSemester from "./getLatest.ts";
import publishRouter from "./publish.ts";

const router = Router();

router.use("/update", updateSemester);
router.use("/linkForm", linkForm);
router.use("/delete", deleteSemester);
router.use("/create", createSemester);
router.use("/get", getAllSemesters);
router.use("/getLatest", getLatestSemester);
router.use("/publish", publishRouter);

export default router;