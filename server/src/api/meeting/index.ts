// server/src/api/meeting/index.ts
import express from "express";
import createMeeting from "./createMeeting.ts";
import getMeetings from "./getMeetings.ts";
import getMeetingDetails from "./getMeetingDetails.ts";
import submitAvailability from "./submitAvailability.ts";
import finalizeMeeting from "./finalizeMeeting.ts";
import getAllUsers from "./getAllUsers.ts";
import remindMeeting from "./remindMeeting.ts";
import deleteMeeting from "./deleteMeeting.ts";
import updateMeetingDetails from "./updateMeetingDetails.ts";

const router = express.Router();

router.use("/create", createMeeting);
router.use("/all", getMeetings);
router.use("/details", getMeetingDetails);
router.use("/respond", submitAvailability);
router.use("/finalize", finalizeMeeting);
router.use("/all-users", getAllUsers);
router.use("/remind", remindMeeting);
router.use("/delete", deleteMeeting);
router.use("/update-details", updateMeetingDetails);

export default router;
