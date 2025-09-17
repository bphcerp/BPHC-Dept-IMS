import { Router } from "express";
import getPrefFacultyRouter from "./getPrefFaculty.ts";

const router = Router();

router.use("/getPreferredFaculty", getPrefFacultyRouter);

export default router;
