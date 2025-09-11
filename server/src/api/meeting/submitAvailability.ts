// server/src/api/meeting/submitAvailability.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    meetingAvailability,
    meetingParticipants,
} from "@/config/db/schema/meeting.ts";
import { meetingSchemas,  } from "lib";
import { eq, and } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { completeTodo } from "@/lib/todos/index.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const body = meetingSchemas.submitAvailabilitySchema.parse(req.body);
        const participantEmail = req.user!.email;

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
        });

        await completeTodo({
            module: "Meeting" as any,
            completionEvent: `meeting:rsvp:${body.meetingId}`,
            assignedTo: participantEmail,
        });

        res.status(200).json({
            success: true,
            message: "Availability submitted successfully.",
        });
    })
);

export default router;
