// server/src/config/db/schema/meeting.ts
import {
    pgTable,
    serial,
    text,
    integer,
    timestamp,
    unique,
    pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./admin.ts";

export const meetingAvailabilityStatusEnum = pgEnum(
    "meeting_availability_status",
    ["available", "unavailable"]
);

export const meetingStatusEnum = pgEnum("meeting_status", [
    "pending_responses",
    "awaiting_finalization",
    "scheduled",
    "cancelled",
    "completed",
]);

export const meetings = pgTable("meetings", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    purpose: text("purpose"),
    duration: integer("duration").notNull(),
    organizerEmail: text("organizer_email")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
    deadline: timestamp("deadline", { withTimezone: true }).notNull(),
    finalizedTime: timestamp("finalized_time", { withTimezone: true }),
    venue: text("venue"),
    googleMeetLink: text("google_meet_link"),
    status: meetingStatusEnum("status").default("pending_responses").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});

export const meetingParticipants = pgTable(
    "meeting_participants",
    {
        id: serial("id").primaryKey(),
        meetingId: integer("meeting_id")
            .notNull()
            .references(() => meetings.id, { onDelete: "cascade" }),
        participantEmail: text("participant_email")
            .notNull()
            .references(() => users.email, { onDelete: "cascade" }),
    },
    // FIX: Change from an object to an array
    (table) => [unique().on(table.meetingId, table.participantEmail)]
);

export const meetingTimeSlots = pgTable("meeting_time_slots", {
    id: serial("id").primaryKey(),
    meetingId: integer("meeting_id")
        .notNull()
        .references(() => meetings.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
});

export const meetingAvailability = pgTable(
    "meeting_availability",
    {
        id: serial("id").primaryKey(),
        timeSlotId: integer("time_slot_id")
            .notNull()
            .references(() => meetingTimeSlots.id, { onDelete: "cascade" }),
        participantEmail: text("participant_email")
            .notNull()
            .references(() => users.email, { onDelete: "cascade" }),
        availability: meetingAvailabilityStatusEnum("availability").notNull(),
    },
    // FIX: Change from an object to an array
    (table) => [unique().on(table.timeSlotId, table.participantEmail)]
);
