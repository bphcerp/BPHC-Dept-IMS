// server/src/api/meeting/getMeetingDetails.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { eq } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { meetings } from "@/config/db/schema/meeting.ts"; // Corrected: Import the schema object

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
                        availability: true,
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
        res.status(200).json({ meeting });
    })
);

export default router;
