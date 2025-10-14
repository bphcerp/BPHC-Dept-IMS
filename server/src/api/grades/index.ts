import express from "express";
import uploadExcel from "./uploadExcel.ts";
import exportExcel from "./exportExcel.ts";
import supervisorRouter from "./supervisor/index.ts";
import instructorRouter from "./instructor/index.ts";
import instructorSaveRouter from "./instructor/save.ts";
import instructorAssignmentsRouter from "./instructorAssignments.ts";
import publicRouter from "./public/index.ts";
import getAllSavedGrades from "./public/getAllSavedGrades.ts";
import sendMidsemNotification from "./notifications/sendMidsemNotification.ts";
import sendEndsemNotification from "./notifications/sendEndsemNotification.ts";
import submitGrades from "./submitGrades.ts";
import assignStudentInstructor from "./assignStudentInstructor.ts";
import facultyList from "./facultyList.ts";

const router = express.Router();

router.use("/upload", uploadExcel);
router.use("/export", exportExcel);
router.use("/supervisor", supervisorRouter);
router.use("/instructor", instructorRouter);
router.use("/instructor/save", instructorSaveRouter);
router.use("/instructor-assignments", instructorAssignmentsRouter);
router.use("/public", publicRouter);
router.use("/public/get-all-saved-grades", getAllSavedGrades);
router.use("/notifications/send-midsem", sendMidsemNotification);
router.use("/notifications/send-endsem", sendEndsemNotification);
router.use("/submit-grades", submitGrades);
router.use("/assign-student-instructor", assignStudentInstructor);
router.use("/faculty-list", facultyList);

export default router;
