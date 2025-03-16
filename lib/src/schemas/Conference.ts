import { Field } from "multer";
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

export const reviewFieldBodySchema = z.object({
    comments: z.string(),
    status: z.boolean(),
});

export const fileFieldNames = [
    "letterOfInvitation",
    "firstPageOfPaper",
    "reviewersComments",
    "detailsOfEvent",
    "otherDocuments",
] as const;

export const multerFileFields: Readonly<Field[]> = (
    fileFieldNames as Readonly<string[]>
).map((x) => {
    return { name: x, maxCount: 1 };
});

export const fieldTypes = z.enum(["text", "number", "date", "file"]);
