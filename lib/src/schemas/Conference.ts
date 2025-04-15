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

export const upsertApplicationBodySchema = z.object({
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

export const flowBodySchema = z.object({
    directFlow: z.boolean(),
});

export const reviewApplicationBodySchema = z.discriminatedUnion("status", [
    z.object({
        status: z.literal(true),
        comments: z.string().optional(),
    }),
    z.object({
        status: z.literal(false),
        comments: z.string().trim().nonempty(),
    }),
]);

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
    application: {
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
        travelReimbursement: number;
        registrationFeeReimbursement: number;
        dailyAllowanceReimbursement: number;
        accommodationReimbursement: number;
        otherReimbursement: number;
        letterOfInvitation?: fileFieldResponse;
        firstPageOfPaper?: fileFieldResponse;
        reviewersComments?: fileFieldResponse;
        detailsOfEvent?: fileFieldResponse;
        otherDocuments?: fileFieldResponse;
    };
    reviews: {
        status: boolean;
        comments: string | null;
        createdAt: string;
    }[];
};

export const fieldsToFrontend = {
    purpose: "Purpose",
    contentTitle: "Title of the Paper / Talk / Poster",
    eventName: "Name of the Journal / Conference / Workshop / Laboratory",
    venue: "Venue",
    organizedBy: "Organized by",
    modeOfEvent: "Mode of event",
    description: "Brief Description or Justification of the purpose",
    travelReimbursement: "Travel",
    registrationFeeReimbursement: "Registration Fee / Page Charges",
    dailyAllowanceReimbursement: "Daily Allowance",
    accommodationReimbursement: "Accommodation",
    otherReimbursement: "Any Other, if any",
    letterOfInvitation: "Letter of Invitation / Acceptance of the paper",
    firstPageOfPaper: "First page of paper",
    reviewersComments: "Reviewers Comments",
    detailsOfEvent: "Details of the conference / Journal",
    otherDocuments: "Any other documents",
};
