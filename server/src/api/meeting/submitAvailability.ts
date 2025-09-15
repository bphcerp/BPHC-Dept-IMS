// server/src/api/meeting/submitAvailability.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    meetingAvailability,
    meetingParticipants,
    meetings,
    meetingTimeSlots,
} from "@/config/db/schema/meeting.ts";
import { meetingSchemas, modules } from "lib";
import { eq, and, countDistinct } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { completeTodo, createNotifications } from "@/lib/todos/index.ts";
import { sendEmail } from "@/lib/common/email.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const body = meetingSchemas.submitAvailabilitySchema.parse(req.body);
        const participantEmail = req.user!.email;

        const meeting = await db.query.meetings.findFirst({
            where: eq(meetings.id, body.meetingId),
            columns: {
                id: true,
                deadline: true,
                status: true,
                organizerEmail: true,
                title: true,
            },
        });

        if (!meeting) {
            throw new HttpError(HttpCode.NOT_FOUND, "Meeting not found.");
        }

        const allowedStatuses: string[] = [
            "pending_responses",
            "awaiting_finalization",
        ];
        if (
            new Date() > meeting.deadline ||
            !allowedStatuses.includes(meeting.status)
        ) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Cannot submit availability. The deadline has passed or the meeting has already been scheduled or cancelled."
            );
        }

        const isParticipant = await db.query.meetingParticipants.findFirst({
            where: and(
                eq(meetingParticipants.meetingId, body.meetingId),
                eq(meetingParticipants.participantEmail, participantEmail)
            ),
        });

        if (!isParticipant) {
            throw new HttpError(
                HttpCode.FORBIDDEN,
                "You are not a participant in this meeting."
            );
        }

        await db.transaction(async (tx) => {
            for (const avail of body.availability) {
                await tx
                    .insert(meetingAvailability)
                    .values({
                        timeSlotId: avail.timeSlotId,
                        participantEmail: participantEmail,
                        availability: avail.status,
                    })
                    .onConflictDoUpdate({
                        target: [
                            meetingAvailability.timeSlotId,
                            meetingAvailability.participantEmail,
                        ],
                        set: { availability: avail.status },
                    });
            }

            await completeTodo(
                {
                    module: modules[11],
                    completionEvent: `meeting:rsvp:${body.meetingId}`,
                    assignedTo: participantEmail,
                },
                tx
            );

            const [participantStats] = await tx
                .select({
                    total: countDistinct(meetingParticipants.participantEmail),
                })
                .from(meetingParticipants)
                .where(eq(meetingParticipants.meetingId, body.meetingId));

            const participantCount = participantStats.total;

            const [responseStats] = await tx
                .select({
                    total: countDistinct(meetingAvailability.participantEmail),
                })
                .from(meetingAvailability)
                .innerJoin(
                    meetingTimeSlots,
                    eq(meetingAvailability.timeSlotId, meetingTimeSlots.id)
                )
                .where(eq(meetingTimeSlots.meetingId, body.meetingId));
            const responseCount = responseStats.total;

            if (
                participantCount === responseCount &&
                meeting.status === "pending_responses"
            ) {
                await tx
                    .update(meetings)
                    .set({ status: "awaiting_finalization" })
                    .where(eq(meetings.id, body.meetingId));

                const subject = `All responses received for: ${meeting.title}`;
                const content = `All participants have submitted their availability for the meeting "${meeting.title}". You can now finalize the meeting time.`;
                await createNotifications(
                    [
                        {
                            userEmail: meeting.organizerEmail,
                            title: subject,
                            content,
                            module: modules[11],
                        },
                    ],
                    false,
                    tx
                );
                await sendEmail({
                    to: meeting.organizerEmail,
                    subject,
                    text: content,
                });
            }
        });
        res.status(200).json({
            success: true,
            message: "Availability submitted successfully.",
        });
    })
);

export default router;
