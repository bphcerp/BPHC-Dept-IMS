import { Router } from "express";
import getPrefFacultyRouter from "./getPrefFaculty.ts";
import createRouter from "./create.ts";

const router = Router();

router.use("/getPreferredFaculty", getPrefFacultyRouter);
router.use("/create", createRouter);

export default router;
