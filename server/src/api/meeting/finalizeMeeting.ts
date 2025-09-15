// server/src/api/meeting/finalizeMeeting.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { meetings, meetingTimeSlots } from "@/config/db/schema/meeting.ts";
import { meetingSchemas, modules } from "lib";
import { eq, and } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { createNotifications } from "@/lib/todos/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import {
    schedulePreMeetingReminder,
    scheduleCompletionJob,
} from "@/lib/jobs/meetingJobs.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const body = meetingSchemas.finalizeMeetingSchema.parse(req.body);
        const organizerEmail = req.user!.email;

        const meeting = await db.query.meetings.findFirst({
            where: and(
                eq(meetings.id, body.meetingId),
                eq(meetings.organizerEmail, organizerEmail)
            ),
            with: {
                participants: true,
            },
        });

        if (!meeting) {
            throw new HttpError(
                HttpCode.FORBIDDEN,
                "You are not the organizer of this meeting."
            );
        }
        if (meeting.status === "scheduled" || meeting.status === "completed") {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "This meeting has already been finalized."
            );
        }

        const finalSlot = await db.query.meetingTimeSlots.findFirst({
            where: and(
                eq(meetingTimeSlots.id, body.finalTimeSlotId),
                eq(meetingTimeSlots.meetingId, body.meetingId)
            ),
        });

        if (!finalSlot) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "The selected time slot does not belong to this meeting."
            );
        }

        await db
            .update(meetings)
            .set({
                finalizedTime: finalSlot.startTime,
                venue: body.venue ?? null,
                googleMeetLink: body.googleMeetLink ?? null,
                status: "scheduled",
            })
            .where(eq(meetings.id, body.meetingId));

        const meetingEndTime = new Date(
            finalSlot.startTime.getTime() + meeting.duration * 60000
        );
        await schedulePreMeetingReminder(meeting.id, finalSlot.startTime);
        await scheduleCompletionJob(meeting.id, meetingEndTime);

        const allParticipants = meeting.participants.map(
            (p) => p.participantEmail
        );
        const subject = `Meeting Finalized: ${meeting.title}`;

        let locationDetails = "";
        if (body.venue) locationDetails += `Venue: ${body.venue}\n`;
        if (body.googleMeetLink) {
            locationDetails += `Google Meet: ${body.googleMeetLink}\n`;
        }

        const description = `The meeting "${
            meeting.title
        }" has been scheduled for ${finalSlot.startTime.toLocaleString()}.\n\n${locationDetails}`;

        await createNotifications(
            allParticipants.map((email) => ({
                userEmail: email,
                title: subject,
                content: description,
                module: modules[11],
            }))
        );

        await sendBulkEmails(
            allParticipants.map((email) => ({
                to: email,
                subject,
                text: description,
            }))
        );

        res.status(200).json({
            success: true,
            message: "Meeting finalized and notifications sent.",
        });
    })
);

export default router;
