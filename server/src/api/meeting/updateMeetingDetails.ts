// server/src/api/meeting/updateMeetingDetails.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { meetings, finalizedMeetingSlots } from "@/config/db/schema/meeting.ts";
import { meetingSchemas, modules } from "lib";
import { eq, and } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { createNotifications } from "@/lib/todos/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";

const router = express.Router();

router.put(
    "/:meetingId/slot/:slotId",
    checkAccess(), 
    asyncHandler(async (req, res) => {
        const meetingId = parseInt(req.params.meetingId, 10);
        const slotId = parseInt(req.params.slotId, 10);
        const body = meetingSchemas.updateMeetingSlotSchema.parse(req.body);
        const organizerEmail = req.user!.email;

        const meeting = await db.query.meetings.findFirst({
            where: and(
                eq(meetings.id, meetingId),
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

        const slot = await db.query.finalizedMeetingSlots.findFirst({
            where: and(
                eq(finalizedMeetingSlots.id, slotId),
                eq(finalizedMeetingSlots.meetingId, meetingId)
            ),
        });

        if (!slot) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "Finalized slot not found for this meeting."
            );
        }

        if (meeting.status !== "scheduled") {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "This meeting is not scheduled and cannot be updated."
            );
        }

        await db
            .update(finalizedMeetingSlots)
            .set({
                venue: body.venue ?? null,
                googleMeetLink: body.googleMeetLink ?? null,
            })
            .where(eq(finalizedMeetingSlots.id, slotId));

        const allParticipants = [
            ...meeting.participants.map((p) => p.participantEmail),
            organizerEmail,
        ];
        const subject = `Meeting Details Updated: ${meeting.title}`;
        let locationDetails = "";
        if (body.venue) locationDetails += `New Venue: ${body.venue}\n`;
        if (body.googleMeetLink) {
            locationDetails += `New Google Meet: ${body.googleMeetLink}\n`;
        }

        const description = `The details for the meeting "${
            meeting.title
        }" scheduled for ${slot.startTime.toLocaleString()} have been updated.\n\n${locationDetails}`;

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
            message: "Meeting details updated and notifications sent.",
        });
    })
);

export default router;
