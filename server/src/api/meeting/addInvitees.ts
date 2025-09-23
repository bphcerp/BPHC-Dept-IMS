// server/src/api/meeting/addInvitees.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    meetings,
    meetingParticipants,
    finalizedMeetingSlots,
} from "@/config/db/schema/meeting.ts";
import { meetingSchemas, modules } from "lib";
import { eq, and } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { createNotifications, createTodos } from "@/lib/todos/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";

const router = express.Router();

// Manual implementation of isToday function
const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};

router.post(
    "/",
    checkAccess("meeting:use"),
    asyncHandler(async (req, res) => {
        const body = meetingSchemas.addInviteesSchema.parse(req.body);
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
        if (meeting.status !== "scheduled") {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "You can only add invitees to a scheduled meeting."
            );
        }

        await db
            .insert(meetingParticipants)
            .values(
                body.participants.map((email) => ({
                    meetingId: body.meetingId,
                    participantEmail: email,
                }))
            )
            .onConflictDoNothing();

        const finalSlots = await db.query.finalizedMeetingSlots.findMany({
            where: eq(finalizedMeetingSlots.meetingId, body.meetingId),
        });

        if (finalSlots.length > 0) {
            const subject = `Meeting Invitation: ${meeting.title}`;
            const slotsDetails = finalSlots
                .map((slot, index) => {
                    let details = `Meet ${index + 1}: ${slot.startTime.toLocaleString()}`;
                    if (slot.venue) details += `\nVenue: ${slot.venue}`;
                    if (slot.googleMeetLink)
                        details += `\nGoogle Meet: ${slot.googleMeetLink}`;
                    return details;
                })
                .join("\n\n");

            const description = `You have been invited to the meeting "${meeting.title}" by ${organizerEmail}.\n\nThe meeting has already been scheduled for the following time(s):\n\n${slotsDetails}`;

            await createNotifications(
                body.participants.map((email) => ({
                    userEmail: email,
                    title: subject,
                    content: description,
                    module: modules[11],
                }))
            );
            await sendBulkEmails(
                body.participants.map((email) => ({
                    to: email,
                    subject,
                    text: description,
                }))
            );

            // If any slot is today, create the day-of todo immediately for new invitees
            const todosToCreate = [];
            for (const slot of finalSlots) {
                if (isToday(slot.startTime)) {
                    for (const email of body.participants) {
                        todosToCreate.push({
                            assignedTo: email,
                            createdBy: "system",
                            title: `Meeting Today: ${meeting.title} at ${slot.startTime.toLocaleTimeString()}`,
                            description: `This meeting is scheduled for today. Venue: ${slot.venue || "N/A"}, Link: ${slot.googleMeetLink || "N/A"}`,
                            module: modules[11],
                            completionEvent: `meeting:day-of:${slot.id}`,
                            link: `/meeting/view/${meeting.id}`,
                        });
                    }
                }
            }
            if (todosToCreate.length > 0) {
                await createTodos(todosToCreate);
            }
        }

        res.status(200).json({
            success: true,
            message: "New invitees added and notified successfully.",
        });
    })
);

export default router;
