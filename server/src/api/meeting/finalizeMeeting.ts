// server/src/api/meeting/finalizeMeeting.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    meetings,
    meetingTimeSlots,
    finalizedMeetingSlots,
} from "@/config/db/schema/meeting.ts";
import { meetingSchemas, modules } from "lib";
import { eq, and, inArray } from "drizzle-orm";
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
            with: { participants: true },
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

        const timeSlotIds = body.finalSlots.map((s) => s.timeSlotId);
        const requestedTimeSlots = await db
            .select()
            .from(meetingTimeSlots)
            .where(
                and(
                    eq(meetingTimeSlots.meetingId, body.meetingId),
                    inArray(meetingTimeSlots.id, timeSlotIds)
                )
            );

        if (requestedTimeSlots.length !== timeSlotIds.length) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "One or more selected time slots do not belong to this meeting."
            );
        }

        await db.transaction(async (tx) => {
            await tx
                .update(meetings)
                .set({ status: "scheduled" })
                .where(eq(meetings.id, body.meetingId));

            for (const finalSlot of body.finalSlots) {
                const originalSlot = requestedTimeSlots.find(
                    (ts) => ts.id === finalSlot.timeSlotId
                )!;
                const meetingEndTime = new Date(
                    originalSlot.startTime.getTime() + meeting.duration * 60000
                );

                const [newFinalizedSlot] = await tx
                    .insert(finalizedMeetingSlots)
                    .values({
                        meetingId: body.meetingId,
                        startTime: originalSlot.startTime,
                        endTime: meetingEndTime,
                        venue: finalSlot.venue ?? null,
                        googleMeetLink: finalSlot.googleMeetLink ?? null,
                    })
                    .returning();

                await schedulePreMeetingReminder(
                    newFinalizedSlot.id,
                    originalSlot.startTime
                );
                await scheduleCompletionJob(
                    newFinalizedSlot.id,
                    meetingEndTime
                );
            }
        });

        const allParticipants = meeting.participants.map(
            (p) => p.participantEmail
        );
        const subject = `Meeting Finalized: ${meeting.title}`;

        const finalizedSlotsDetails = body.finalSlots
            .map((fs, index) => {
                const originalSlot = requestedTimeSlots.find(
                    (ts) => ts.id === fs.timeSlotId
                )!;
                let details = `Meet ${index + 1}: ${originalSlot.startTime.toLocaleString()}`;
                if (fs.venue) details += `\nVenue: ${fs.venue}`;
                if (fs.googleMeetLink)
                    details += `\nGoogle Meet: ${fs.googleMeetLink}`;
                return details;
            })
            .join("\n\n");

        const description = `The meeting "${meeting.title}" has been scheduled. Please find the finalized option(s) below:\n\n${finalizedSlotsDetails}`;

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
