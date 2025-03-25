import express from "express";
import getAllSem from "./getAllSem.ts";
import updateSemesterDates from "./updateSemesterDates.ts";

const router = express.Router();
router.use("/getAllSem", getAllSem);
router.use("/updateSemesterDates", updateSemesterDates);

export default router;