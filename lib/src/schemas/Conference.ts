import { Field } from "multer";
import z from "zod";

export const states = [
    "Faculty",
    "DRC Member",
    "DRC Convener",
    "HoD",
    "Completed",
] as const;

export const modesOfEvent = ["online", "offline"] as const;

export const upsertApplicationClientSchema = z.object({
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
    reimbursements: z.preprocess(
        (val) => {
            if (typeof val === "string") {
                try {
                    return JSON.parse(val);
                } catch {
                    return undefined;
                }
            }
            return val;
        },
        z
            .array(
                z.object({
                    key: z
                        .string()
                        .trim()
                        .min(1, "Field name is required")
                        .max(50, "Field name is too long"),
                    amount: z
                        .string()
                        .trim()
                        .regex(/^$|^\d+(\.\d{1,2})?$/, {
                            message:
                                "Amount must be a number with at most 2 decimal places",
                        })
                        .optional(),
                })
            )
            .max(10, "Maximum of 10 fields allowed")
            .refine(
                (arr) => {
                    const keys = arr
                        .map((f) => f.key.trim().toLowerCase())
                        .filter((key) => key.length > 0);
                    return new Set(keys).size === keys.length;
                },
                { message: "Field names must be unique" }
            )
    ),
    fundingSplit: z.preprocess(
        (val) => {
            if (typeof val === "string") {
                try {
                    return JSON.parse(val);
                } catch {
                    return undefined;
                }
            }
            return val;
        },
        z
            .array(
                z.object({
                    source: z
                        .string()
                        .trim()
                        .min(1, "Funding source is required")
                        .max(100, "Funding source name is too long"),
                    amount: z
                        .string()
                        .trim()
                        .regex(/^$|^\d+(\.\d{1,2})?$/, {
                            message:
                                "Amount must be a number with at most 2 decimal places",
                        })
                        .optional(),
                })
            )
            .max(5, "Maximum of 5 funding sources allowed")
            .refine(
                (arr) => {
                    const sources = arr
                        .map((f) => f.source.trim().toLowerCase())
                        .filter((key) => key.length > 0);
                    return new Set(sources).size === sources.length;
                },
                { message: "Funding source names must be unique" }
            )
    ),
});

export const upsertApplicationBodySchema = upsertApplicationClientSchema
    .transform((data) => {
        data.reimbursements = data.reimbursements.filter((item) => {
            return item.amount && parseFloat(item.amount) > 0;
        });
        data.fundingSplit = data.fundingSplit.filter((item) => {
            return item.amount && parseFloat(item.amount) > 0;
        });
        return data;
    })
    .refine(
        (data) => {
            const reimbursementTotal = data.reimbursements.reduce(
                (sum, item) => sum + parseFloat(item.amount || "0"),
                0
            );
            const fundingTotal = data.fundingSplit.reduce(
                (sum, item) => sum + parseFloat(item.amount || "0"),
                0
            );
            return Math.abs(reimbursementTotal - fundingTotal) < 0.01;
        },
        {
            message:
                "Total funding split must equal total reimbursement amount",
            path: ["fundingSplit"],
        }
    );

export const flowBodySchema = z.object({
    directFlow: z.boolean(),
});

export type FlowBody = z.infer<typeof flowBodySchema>;

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

export type ReviewApplicationBody = z.infer<typeof reviewApplicationBodySchema>;

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
    isDirect?: boolean;
};

export type File = {
    fileName: string;
    url: string;
};

export type ViewApplicationResponse = {
    application: {
        id: number;
        createdAt: Date | string;
        userEmail: string;
        state: (typeof states)[number];
        approvalForm?: string;
        purpose: string;
        contentTitle: string;
        eventName: string;
        venue: string;
        dateFrom: Date | string;
        dateTo: Date | string;
        organizedBy: string;
        modeOfEvent: (typeof modesOfEvent)[number];
        description: string;
        reimbursements: {
            key: string;
            amount: string;
        }[];
        fundingSplit: {
            source: string;
            amount: string;
        }[];
        letterOfInvitation?: File;
        firstPageOfPaper?: File;
        reviewersComments?: File;
        detailsOfEvent?: File;
        otherDocuments?: File;
    };
    reviews: {
        status: boolean;
        comments: string | null;
        createdAt: string;
    }[];
    isDirect?: boolean;
};

export const fieldsToFrontend = {
    purpose: "Purpose",
    contentTitle: "Title of the Paper / Talk / Poster",
    eventName: "Name of the Journal / Conference / Workshop / Laboratory",
    venue: "Venue",
    organizedBy: "Organized by",
    modeOfEvent: "Mode of event",
    description: "Brief Description or Justification of the purpose",
    reimbursements: "Reimbursements",
    letterOfInvitation: "Letter of Invitation / Acceptance of the paper",
    firstPageOfPaper: "First page of paper",
    reviewersComments: "Reviewers Comments",
    detailsOfEvent: "Details of the conference / Journal",
    otherDocuments: "Any other documents",
};
