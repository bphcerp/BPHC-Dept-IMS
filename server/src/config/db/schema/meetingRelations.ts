// server/src/config/db/schema/meetingRelations.ts
import { relations } from "drizzle-orm";
import {
    meetings,
    meetingParticipants,
    meetingTimeSlots,
    meetingAvailability,
} from "./meeting.ts";
import { users } from "./admin.ts";

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
    organizer: one(users, {
        fields: [meetings.organizerEmail],
        references: [users.email],
    }),
    participants: many(meetingParticipants),
    timeSlots: many(meetingTimeSlots),
}));

export const meetingParticipantsRelations = relations(
    meetingParticipants,
    ({ one }) => ({
        meeting: one(meetings, {
            fields: [meetingParticipants.meetingId],
            references: [meetings.id],
        }),
        participant: one(users, {
            fields: [meetingParticipants.participantEmail],
            references: [users.email],
        }),
    })
);

export const meetingTimeSlotsRelations = relations(
    meetingTimeSlots,
    ({ one, many }) => ({
        meeting: one(meetings, {
            fields: [meetingTimeSlots.meetingId],
            references: [meetings.id],
        }),
        availability: many(meetingAvailability),
    })
);

export const meetingAvailabilityRelations = relations(
    meetingAvailability,
    ({ one }) => ({
        timeSlot: one(meetingTimeSlots, {
            fields: [meetingAvailability.timeSlotId],
            references: [meetingTimeSlots.id],
        }),
        participant: one(users, {
            fields: [meetingAvailability.participantEmail],
            references: [users.email],
        }),
    })
);
