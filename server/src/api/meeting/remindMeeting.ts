// server/src/api/meeting/remindMeeting.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    meetings,
    meetingParticipants,
    meetingAvailability,
    meetingTimeSlots, // FIX: Import the missing table schema
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

        // Find participants who have responded
        const respondedParticipants = await db
            .selectDistinct({ email: meetingAvailability.participantEmail }) // Use distinct to avoid duplicates
            .from(meetingAvailability)
            .innerJoin(
                meetingTimeSlots,
                eq(meetingAvailability.timeSlotId, meetingTimeSlots.id)
            )
            .where(eq(meetingTimeSlots.meetingId, body.meetingId));

        const respondedEmails = respondedParticipants.map((p) => p.email);

        // Find participants who have not responded
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
        }

        // Send reminder emails
        const subject = `Reminder: RSVP for meeting: ${meeting.title}`;
        const description = `<p>This is a reminder to submit your availability for the meeting "<b>${
            meeting.title
        }</b>" organized by ${organizerEmail}.</p><p>Please respond by ${meeting.deadline.toLocaleString()}.</p><p><a href="${
            environment.FRONTEND_URL
        }/meeting/respond/${meeting.id}">Click here to respond</a>.</p>`;

        await sendBulkEmails(
            nonRespondedEmails.map((email) => ({
                to: email,
                subject,
                html: description,
            }))
        );

        res.status(200).json({
            success: true,
            message: `Reminder sent to ${nonRespondedEmails.length} participant(s).`,
        });
    })
);

export default router;
