// server/src/api/phd/drcMember/index.ts
import express from "express";
import generateCourseworkForm from "./generateCourseworkForm.ts";
import updatePassingDatesOfPhd from "./updatePassingDatesOfPhd.ts";
import getSuggestedDacMember from "./getSuggestedDacMember.ts";
import suggestTwoBestDacMember from "./suggestTwoBestDacMember.ts";
import updateFinalDac from "./updateFinalDac.ts";
import getQualificationDates from "./getQualificationDates.ts";
import notifySupervisor from "./notifySupervisor.ts";

// New refactored APIs
import examEventsApplicationsRouter from "./exam-events-applications.ts";
import applicationStatusRouter from "./application-status.ts";
import examinerSuggestionsRouter from "./examiner-suggestions.ts";
import examScheduleRouter from "./exam-schedule.ts";
import getSupervisorsForEventRouter from "./getSupervisorsForEvent.ts";
import intimationFormRouter from "./intimation-form.ts";

const router = express.Router();

// Legacy APIs (keeping functional ones)
router.use("/generateCourseworkForm", generateCourseworkForm);

router.use("/updatePassingDatesOfPhd", updatePassingDatesOfPhd);
router.use("/getSuggestedDacMember", getSuggestedDacMember);
router.use("/updateFinalDac", updateFinalDac);
router.use("/suggestTwoBestDacMember", suggestTwoBestDacMember);
router.use("/getQualificationDates", getQualificationDates);
router.use("/notifySupervisor", notifySupervisor);


// New refactored APIs
router.use("/exam-events/applications", examEventsApplicationsRouter);
router.use("/exam-events/supervisors", getSupervisorsForEventRouter);
router.use("/exam-events/suggestions", examinerSuggestionsRouter);
router.use("/exam-events/schedule", examScheduleRouter);
router.use("/exam-events/intimation-data", intimationFormRouter);

router.use("/applications", applicationStatusRouter);

export default router;
