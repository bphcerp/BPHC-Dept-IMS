// server/src/api/meeting/getMeetings.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { meetings, meetingParticipants } from "@/config/db/schema/meeting.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const userEmail = req.user!.email;

        const organizedMeetings = await db.query.meetings.findMany({
            where: eq(meetings.organizerEmail, userEmail),
        });

        const participatedMeetings =
            await db.query.meetingParticipants.findMany({
                where: eq(meetingParticipants.participantEmail, userEmail),
                with: {
                    meeting: true,
                },
            });

        res.status(200).json({
            organized: organizedMeetings,
            invited: participatedMeetings.map((p) => p.meeting),
        });
    })
);

export default router;
