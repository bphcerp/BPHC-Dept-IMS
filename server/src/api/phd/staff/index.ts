// server/src/api/phd/staff/index.ts
import express from "express";
import semestersRouter from "./semesters.ts";
import subAreasRouter from "./sub-areas.ts";
import examEventsRouter from "./exam-events.ts";

const router = express.Router();

router.use("/semesters", semestersRouter);
router.use("/sub-areas", subAreasRouter);
router.use("/exam-events", examEventsRouter);

export default router;
