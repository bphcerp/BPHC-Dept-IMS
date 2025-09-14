// server/src/api/meeting/finalizeMeeting.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { meetings, meetingTimeSlots } from "@/config/db/schema/meeting.ts";
import { meetingSchemas } from "lib";
import { eq, and } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { createTodos } from "@/lib/todos/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
// You might need a utility to create Google Meet links. This is a placeholder.
// import { createGoogleMeetLink } from '@/lib/google';

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
            with: { participants: true },
        });

        if (!meeting) {
            throw new HttpError(
                HttpCode.FORBIDDEN,
                "You are not the organizer of this meeting."
            );
        }

        if (meeting.finalizedTime) {
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

        let venue: string | null = null;
        let googleMeetLink: string | null = null;
        let locationDetails: string;

        if (body.location.type === "venue") {
            venue = body.location.details;
            locationDetails = `Venue: ${venue}`;
        } else {
            // googleMeetLink = await createGoogleMeetLink(meeting.title, finalSlot.startTime, finalSlot.endTime);
            googleMeetLink = `https://meet.google.com/lookup/${Math.random().toString(36).substring(2)}`; // Placeholder
            locationDetails = `Google Meet: <a href="${googleMeetLink}">${googleMeetLink}</a>`;
        }

        await db
            .update(meetings)
            .set({
                finalizedTime: finalSlot.startTime,
                venue,
                googleMeetLink,
            })
            .where(eq(meetings.id, body.meetingId));

        const allParticipants = meeting.participants.map(
            (p) => p.participantEmail
        );
        const subject = `Meeting Finalized: ${meeting.title}`;
        const description = `The meeting "${meeting.title}" has been scheduled for ${finalSlot.startTime.toLocaleString()}. ${locationDetails}`;

        await createTodos(
            allParticipants.map((email) => ({
                assignedTo: email,
                createdBy: organizerEmail,
                title: subject,
                description,
                module: "Meeting" as any,
                completionEvent: `meeting:finalized:${body.meetingId}`,
            }))
        );

        await sendBulkEmails(
            allParticipants.map((email) => ({
                to: email,
                subject,
                html: `<p>${description}</p>`,
            }))
        );

        res.status(200).json({
            success: true,
            message: "Meeting finalized and notifications sent.",
        });
    })
);

export default router;
