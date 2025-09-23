import { Router } from "express";
import getPrefFacultyRouter from "./getPrefFaculty.ts";
import createRouter from "./create.ts";
import getRouter from "./get.ts";

const router = Router();

router.use("/getPreferredFaculty", getPrefFacultyRouter);
router.use("/create", createRouter);
router.use("/get", getRouter);

export default router;
