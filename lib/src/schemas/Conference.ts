import { Field } from "multer";
import z from "zod";
import { fileFieldResponse } from "./Form.ts";

export const states = [
    "Faculty",
    "DRC Member",
    "DRC Convener",
    "HoD",
    "Completed",
] as const;

const modesOfEvent = ["online", "offline"] as const;

export const createApplicationBodySchema = z.object({
    purpose: z.string().nonempty(),
    contentTitle: z.string().nonempty(),
    eventName: z.string().nonempty(),
    venue: z.string().nonempty(),
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),
    organizedBy: z.string().nonempty(),
    modeOfEvent: z.enum(modesOfEvent, {
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
    accommodationReimbursement: z.coerce
        .number()
        .positive()
        .finite()
        .optional(),
    otherReimbursement: z.coerce.number().positive().finite().optional(),
});

export type CreateApplicationBody = z.infer<typeof createApplicationBodySchema>;

export const pendingApplicationsQuerySchema = z.object({
    state: z.enum(states),
});

export type PendingApplicationsQuery = z.infer<
    typeof pendingApplicationsQuerySchema
>;

export const reviewFieldBodySchema = z.discriminatedUnion("status", [
    z.object({
        status: z.literal(true),
        comments: z.string().optional(),
    }),
    z.object({
        status: z.literal(false),
        comments: z.string().trim().nonempty(),
    }),
]);

export const reviewApplicationBodySchema = z.object({
    status: z.boolean(),
});

export const editFieldBodySchema = z.object({
    value: z.union([
        z.string().nonempty(),
        z.coerce.number().positive().finite(),
        z.coerce.date(),
    ]),
});

export const finalizeApproveApplicationSchema = z.object({
    approve: z.boolean(),
});

export const textFieldNames = [
    "purpose",
    "contentTitle",
    "eventName",
    "venue",
    "organizedBy",
    "modeOfEvent",
    "description",
] as const;

export const dateFieldNames = ["dateFrom", "dateTo"] as const;

export const numberFieldNames = [
    "travelReimbursement",
    "registrationFeeReimbursement",
    "dailyAllowanceReimbursement",
    "accommodationReimbursement",
    "otherReimbursement",
] as const;

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

export type submittedApplicationsResponse = {
    applications: {
        id: number;
        state: (typeof states)[number];
        createdAt: string;
    }[];
};

export type pendingApplicationsResponse = {
    applications: {
        id: number;
        state: (typeof states)[number];
        createdAt: string;
        userEmail: string;
        userName: string | null;
    }[];
};

export type ViewApplicationResponse = {
    id: number;
    createdAt: string;
    userEmail: string;
    state: (typeof states)[number];
    purpose: string;
    contentTitle: string;
    eventName: string;
    venue: string;
    dateFrom: string;
    dateTo: string;
    organizedBy: string;
    modeOfEvent: (typeof modesOfEvent)[number];
    description: string;
    travelReimbursement?: number;
    registrationFeeReimbursement?: number;
    dailyAllowanceReimbursement?: number;
    accommodationReimbursement?: number;
    otherReimbursement?: number;
    letterOfInvitation?: fileFieldResponse;
    firstPageOfPaper?: fileFieldResponse;
    reviewersComments?: fileFieldResponse;
    detailsOfEvent?: fileFieldResponse;
    otherDocuments?: fileFieldResponse;
};
