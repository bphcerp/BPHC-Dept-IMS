// server/src/api/meeting/getMeetingDetails.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { eq } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { meetings } from "@/config/db/schema/meeting.ts";

const router = express.Router();

router.get(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const meetingId = parseInt(req.params.id, 10);
        const userEmail = req.user!.email;

        const meeting = await db.query.meetings.findFirst({
            where: eq(meetings.id, meetingId),
            with: {
                participants: true,
                timeSlots: {
                    with: {
                        availability: {
                            columns: {
                                participantEmail: true,
                                availability: true,
                            },
                        },
                    },
                },
            },
        });

        if (!meeting) {
            throw new HttpError(HttpCode.NOT_FOUND, "Meeting not found");
        }

        const isParticipantOrOrganizer =
            meeting.organizerEmail === userEmail ||
            meeting.participants.some((p) => p.participantEmail === userEmail);

        if (!isParticipantOrOrganizer) {
            throw new HttpError(
                HttpCode.FORBIDDEN,
                "You do not have access to this meeting."
            );
        }

        const augmentedTimeSlots = meeting.timeSlots.map((slot) => {
            const availableCount = slot.availability.filter(
                (a) => a.availability === "available"
            ).length;
            const unavailableCount = slot.availability.filter(
                (a) => a.availability === "unavailable"
            ).length;
            const userAvailability =
                slot.availability.find((a) => a.participantEmail === userEmail)
                    ?.availability ?? null;

            return {
                ...slot,
                availableCount,
                unavailableCount,
                userAvailability,
            };
        });

        const response = { ...meeting, timeSlots: augmentedTimeSlots };
        res.status(200).json({ meeting: response });
    })
);

export default router;
