import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    meetings,
    meetingParticipants,
    meetingAvailability,
    meetingTimeSlots,
    finalizedMeetingSlots,
} from "@/config/db/schema/meeting.ts";
import {
    eq,
    and,
    sql,
    notInArray,
    inArray,
    gte,
    lt,
    or,
    isNull,
    isNotNull,
} from "drizzle-orm";
import { z } from "zod";

const router = express.Router();

const getMeetingsQuerySchema = z.object({
    view: z.enum(["upcoming", "archived"]).default("upcoming"),
});

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const userEmail = req.user!.email;
        const query = getMeetingsQuerySchema.parse(req.query);

        const participantCountsSq = db
            .select({
                meetingId: meetingParticipants.meetingId,
                count: sql<number>`count(${meetingParticipants.participantEmail})`
                    .mapWith(Number)
                    .as("participant_count"),
            })
            .from(meetingParticipants)
            .groupBy(meetingParticipants.meetingId)
            .as("participant_counts");

        const responseCountsSq = db
            .select({
                meetingId: meetingTimeSlots.meetingId,
                count: sql<number>`count(distinct ${meetingAvailability.participantEmail})`
                    .mapWith(Number)
                    .as("response_count"),
            })
            .from(meetingAvailability)
            .innerJoin(
                meetingTimeSlots,
                eq(meetingAvailability.timeSlotId, meetingTimeSlots.id)
            )
            .groupBy(meetingTimeSlots.meetingId)
            .as("response_counts");

        const finalizedSlotsSq = db
            .select({
                meetingId: finalizedMeetingSlots.meetingId,
                finalizedTimes: sql<
                    string[]
                >`array_agg(${finalizedMeetingSlots.startTime} order by ${finalizedMeetingSlots.startTime})`.as(
                    "finalized_times"
                ),
            })
            .from(finalizedMeetingSlots)
            .groupBy(finalizedMeetingSlots.meetingId)
            .as("finalized_slots");

        const maxEndTimeSq = db
            .select({
                meetingId: finalizedMeetingSlots.meetingId,
                maxEndTime: sql<Date>`max(${finalizedMeetingSlots.endTime})`
                    .mapWith(Date)
                    .as("max_end_time"),
            })
            .from(finalizedMeetingSlots)
            .groupBy(finalizedMeetingSlots.meetingId)
            .as("max_end_time_sq");

        const now = new Date();

        const upcomingFilter = and(
            notInArray(meetings.status, ["completed", "cancelled"]),
            or(
                isNull(maxEndTimeSq.maxEndTime),
                gte(maxEndTimeSq.maxEndTime, sql.param(now))
            )
        );

        const archivedFilter = or(
            inArray(meetings.status, ["completed", "cancelled"]),
            and(
                isNotNull(maxEndTimeSq.maxEndTime),
                lt(maxEndTimeSq.maxEndTime, sql.param(now))
            )
        );

        const statusFilter =
            query.view === "upcoming" ? upcomingFilter : archivedFilter;

        const organizedMeetings = await db
            .select({
                id: meetings.id,
                title: meetings.title,
                status: meetings.status,
                organizerEmail: meetings.organizerEmail,
                participantCount:
                    sql<number>`coalesce(${participantCountsSq.count}, 0)`.mapWith(
                        Number
                    ),
                responseCount:
                    sql<number>`coalesce(${responseCountsSq.count}, 0)`.mapWith(
                        Number
                    ),
                finalizedTimes: finalizedSlotsSq.finalizedTimes,
            })
            .from(meetings)
            .leftJoin(
                participantCountsSq,
                eq(meetings.id, participantCountsSq.meetingId)
            )
            .leftJoin(
                responseCountsSq,
                eq(meetings.id, responseCountsSq.meetingId)
            )
            .leftJoin(
                finalizedSlotsSq,
                eq(meetings.id, finalizedSlotsSq.meetingId)
            )
            .leftJoin(maxEndTimeSq, eq(meetings.id, maxEndTimeSq.meetingId))
            .where(and(eq(meetings.organizerEmail, userEmail), statusFilter))
            .orderBy(meetings.createdAt);

        const invitedMeetings = await db
            .select({
                id: meetings.id,
                title: meetings.title,
                status: meetings.status,
                organizerEmail: meetings.organizerEmail,
                participantCount:
                    sql<number>`coalesce(${participantCountsSq.count}, 0)`.mapWith(
                        Number
                    ),
                responseCount:
                    sql<number>`coalesce(${responseCountsSq.count}, 0)`.mapWith(
                        Number
                    ),
                finalizedTimes: finalizedSlotsSq.finalizedTimes,
            })
            .from(meetings)
            .innerJoin(
                meetingParticipants,
                eq(meetings.id, meetingParticipants.meetingId)
            )
            .leftJoin(
                participantCountsSq,
                eq(meetings.id, participantCountsSq.meetingId)
            )
            .leftJoin(
                responseCountsSq,
                eq(meetings.id, responseCountsSq.meetingId)
            )
            .leftJoin(
                finalizedSlotsSq,
                eq(meetings.id, finalizedSlotsSq.meetingId)
            )
            .leftJoin(maxEndTimeSq, eq(meetings.id, maxEndTimeSq.meetingId))
            .where(
                and(
                    eq(meetingParticipants.participantEmail, userEmail),
                    statusFilter
                )
            )
            .orderBy(meetings.createdAt);

        res.status(200).json({
            organized: organizedMeetings,
            invited: invitedMeetings,
        });
    })
);

export default router;
