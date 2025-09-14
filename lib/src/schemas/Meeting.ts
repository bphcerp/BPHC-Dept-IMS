// lib/src/schemas/Meeting.ts
import { z } from "zod";

export const availabilityStatusEnum = z.enum(["available", "unavailable"]);

const createMeetingObjectSchema = z.object({
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
    deadline: z.string().datetime("A valid response deadline is required"),
});

export const createMeetingSchema = createMeetingObjectSchema.refine(
    (data) => {
        const deadline = new Date(data.deadline);
        return data.timeSlots.every((slot) => new Date(slot) > deadline);
    },
    {
        message:
            "All suggested time slots must be after the response deadline.",
        path: ["timeSlots"],
    }
);

export { createMeetingObjectSchema };

const finalizeMeetingObjectSchema = z.object({
    meetingId: z.number().int(),
    finalTimeSlotId: z.number().int(),
    venue: z.string().trim().optional(),
    googleMeetLink: z.string().trim().optional(),
});

export const finalizeMeetingSchema = finalizeMeetingObjectSchema.refine(
    (data) => !!data.venue || !!data.googleMeetLink,
    {
        message: "Either a venue or a Google Meet link must be provided.",
        path: ["venue"],
    }
);
export { finalizeMeetingObjectSchema };

export const updateMeetingDetailsSchema = z
    .object({
        venue: z.string().trim().optional(),
        googleMeetLink: z.string().url("Must be a valid URL").trim().optional(),
    })
    .refine((data) => !!data.venue || !!data.googleMeetLink, {
        message: "Either a venue or a Google Meet link must be provided.",
        path: ["venue"],
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

export const remindMeetingSchema = z.object({
    meetingId: z.number().int(),
});
