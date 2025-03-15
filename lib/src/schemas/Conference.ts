import z from "zod";

export const applyForConferenceBodySchema = z.object({
    purpose: z.string().nonempty(),
    contentTitle: z.string().nonempty(),
    eventName: z.string().nonempty(),
    venue: z.string().nonempty(),
    date: z.coerce.date(),
    organizedBy: z.string().nonempty(),
    modeOfEvent: z.enum(["online", "offline"], {
        message: "Should either be 'online' or 'offline'",
    }),
    description: z.string().nonempty(),
    travelReimbursement: z.coerce.number().positive().finite().optional(),
    registrationFeeReimbursement: z.coerce
        .number()
        .positive()
        .finite()
        .optional(),
    dailyAllowanceReimbursement: z.coerce
        .number()
        .positive()
        .finite()
        .optional(),
    accomodationReimbursement: z.coerce.number().positive().finite().optional(),
    otherReimbursement: z.coerce.number().positive().finite().optional(),
});
