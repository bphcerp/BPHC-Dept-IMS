// lib/src/schemas/Meeting.ts
import { z } from "zod";

export const availabilityStatusEnum = z.enum([
    "best_available",
    "tentative",
    "unavailable",
]);

export const createMeetingSchema = z.object({
    title: z.string().min(1, "Title is required").max(255),
    purpose: z.string().max(1000).optional(),
    participants: z
        .array(z.string().email())
        .min(1, "At least one participant is required"),
    duration: z.coerce
        .number()
        .int()
        .positive("Duration must be a positive number of minutes"),
    timeSlots: z
        .array(z.string().datetime())
        .min(1, "At least one time slot must be suggested"),
    deadline: z.string().datetime(),
});

export const submitAvailabilitySchema = z.object({
    meetingId: z.number().int(),
    availability: z
        .array(
            z.object({
                timeSlotId: z.number().int(),
                status: availabilityStatusEnum,
            })
        )
        .min(1, "You must provide availability for at least one slot."),
});

export const finalizeMeetingSchema = z.object({
    meetingId: z.number().int(),
    finalTimeSlotId: z.number().int(),
    location: z.union([
        z.object({
            type: z.literal("venue"),
            details: z.string().min(1, "Venue details are required"),
        }),
        z.object({
            type: z.literal("google_meet"),
        }),
    ]),
});
