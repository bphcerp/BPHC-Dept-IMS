// server/src/api/meeting/submitAvailability.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    meetingAvailability,
    meetingParticipants,
    meetings,
} from "@/config/db/schema/meeting.ts";
import { meetingSchemas } from "lib";
import { eq, and, sql } from "drizzle-orm";
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

        if (
            new Date() > meeting.deadline ||
            meeting.status !== "pending_responses"
        ) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Cannot submit availability. The deadline has passed or the meeting is already finalized."
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
                    module: "Meeting" as any,
                    completionEvent: `meeting:rsvp:${body.meetingId}`,
                    assignedTo: participantEmail,
                },
                tx
            );

            // Check if all participants have responded
            const counts = await tx
                .select({
                    participantCount:
                        sql<number>`count(distinct ${meetingParticipants.participantEmail})`.mapWith(
                            Number
                        ),
                    responseCount:
                        sql<number>`count(distinct ${meetingAvailability.participantEmail})`.mapWith(
                            Number
                        ),
                })
                .from(meetingParticipants)
                .leftJoin(
                    meetingAvailability,
                    eq(
                        meetingParticipants.participantEmail,
                        meetingAvailability.participantEmail
                    )
                )
                .where(eq(meetingParticipants.meetingId, body.meetingId));

            if (counts[0].participantCount === counts[0].responseCount) {
                await tx
                    .update(meetings)
                    .set({ status: "awaiting_finalization" })
                    .where(eq(meetings.id, body.meetingId));

                // Notify organizer
                const subject = `All responses received for: ${meeting.title}`;
                const content = `<p>All participants have submitted their availability for the meeting "<b>${meeting.title}</b>". You can now finalize the meeting time.</p>`;

                await createNotifications(
                    [
                        {
                            userEmail: meeting.organizerEmail,
                            title: subject,
                            content,
                            module: "Meeting" as any,
                        },
                    ],
                    false,
                    tx
                );

                await sendEmail({
                    to: meeting.organizerEmail,
                    subject,
                    html: content,
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
