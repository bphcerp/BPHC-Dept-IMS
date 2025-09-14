// server/src/api/meeting/getMeetings.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    meetings,
    meetingParticipants,
    meetingAvailability,
} from "@/config/db/schema/meeting.ts";
import { eq, and, sql, ne } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const userEmail = req.user!.email;

        const organizedMeetingsQuery = await db
            .select({
                id: meetings.id,
                title: meetings.title,
                finalizedTime: meetings.finalizedTime,
                organizerEmail: meetings.organizerEmail,
                status: meetings.status,
                participantCount:
                    sql<number>`count(distinct ${meetingParticipants.participantEmail})`.mapWith(
                        Number
                    ),
                responseCount:
                    sql<number>`count(distinct ${meetingAvailability.participantEmail})`.mapWith(
                        Number
                    ),
            })
            .from(meetings)
            .leftJoin(
                meetingParticipants,
                eq(meetings.id, meetingParticipants.meetingId)
            )
            .leftJoin(
                meetingAvailability,
                eq(
                    meetingParticipants.participantEmail,
                    meetingAvailability.participantEmail
                )
            )
            .where(
                and(
                    eq(meetings.organizerEmail, userEmail),
                    ne(meetings.status, "completed"),
                    ne(meetings.status, "cancelled")
                )
            )
            .groupBy(meetings.id);

        const participatedMeetings = await db
            .select({
                meeting: meetings,
            })
            .from(meetings)
            .innerJoin(
                meetingParticipants,
                eq(meetings.id, meetingParticipants.meetingId)
            )
            .where(
                and(
                    eq(meetingParticipants.participantEmail, userEmail),
                    ne(meetings.status, "completed"),
                    ne(meetings.status, "cancelled")
                )
            );

        res.status(200).json({
            organized: organizedMeetingsQuery,
            // Adjust the map to access the meeting object from the new query shape
            invited: participatedMeetings.map((p) => p.meeting),
        });
    })
);

export default router;
