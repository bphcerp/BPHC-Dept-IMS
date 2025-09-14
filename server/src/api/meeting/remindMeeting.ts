// server/src/api/meeting/remindMeeting.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    meetings,
    meetingParticipants,
    meetingAvailability,
    meetingTimeSlots,
} from "@/config/db/schema/meeting.ts";
import { meetingSchemas } from "lib";
import { eq, and } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const body = meetingSchemas.remindMeetingSchema.parse(req.body);
        const organizerEmail = req.user!.email;

        const meeting = await db.query.meetings.findFirst({
            where: and(
                eq(meetings.id, body.meetingId),
                eq(meetings.organizerEmail, organizerEmail)
            ),
        });

        if (!meeting) {
            throw new HttpError(
                HttpCode.FORBIDDEN,
                "You are not the organizer of this meeting."
            );
        }
        if (meeting.status !== "pending_responses") {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Cannot send reminders for this meeting as it is not pending responses."
            );
        }

        const respondedParticipants = await db
            .selectDistinct({ email: meetingAvailability.participantEmail })
            .from(meetingAvailability)
            .innerJoin(
                meetingTimeSlots,
                eq(meetingAvailability.timeSlotId, meetingTimeSlots.id)
            )
            .where(eq(meetingTimeSlots.meetingId, body.meetingId));

        const respondedEmails = respondedParticipants.map((p) => p.email);

        const allParticipants = await db
            .select({ email: meetingParticipants.participantEmail })
            .from(meetingParticipants)
            .where(eq(meetingParticipants.meetingId, body.meetingId));

        const nonRespondedEmails = allParticipants
            .map((p) => p.email)
            .filter((email) => !respondedEmails.includes(email));

        if (nonRespondedEmails.length === 0) {
            res.status(200).json({
                success: true,
                message: "All participants have already responded.",
            });
            return;
        }

        const subject = `Reminder: RSVP for meeting: ${meeting.title}`;
        const description = `This is a reminder to submit your availability for the meeting "${
            meeting.title
        }" organized by ${organizerEmail}.\n\nPlease respond by ${meeting.deadline.toLocaleString()}.\n\nRespond here: ${
            environment.FRONTEND_URL
        }/meeting/respond/${meeting.id}`;

        await sendBulkEmails(
            nonRespondedEmails.map((email) => ({
                to: email,
                subject,
                text: description,
            }))
        );

        res.status(200).json({
            success: true,
            message: `Reminder sent to ${nonRespondedEmails.length} participant(s).`,
        });
    })
);

export default router;
