import { z } from "zod";

export const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
] as const;

export type month = (typeof months)[number];

const monthEnum = z.enum(months);

export const PublicationSchema = z.object({
    citationId: z.string(),
    title: z.string(),
    type: z.string().nullable(),
    journal: z.string().nullable(),
    volume: z.string().nullable(),
    issue: z.string().nullable(),
    month: monthEnum.nullable(),
    year: z.string(),
    link: z.string().nullable(),
    citations: z.string().nullable(),
    authorNames: z.string(),
});

export const ReseargencePublicationSchema = z.object({
    pubId: z.number().int(),
    authors: z.string(),
    homeAuthors: z.string().nullable(),
    homeAuthorDepartment: z.string().nullable(),
    homeAuthorInstitute: z.string().nullable(),
    publicationTitle: z.string(),
    scs: z.number().int().nullable(),
    wos: z.number().int().nullable(),
    sci: z.string().nullable(),
    sourcePublication: z.string().nullable(),
    level: z.string().nullable(),
    type: z.string().nullable(),
    year: z.number().int(),
    month: monthEnum.nullable(),
    homeAuthorLocation: z.string().nullable(),
    volNo: z.string().nullable(),
    issNo: z.string().nullable(),
    bPage: z.string().nullable(),
    ePage: z.string().nullable(),
    snip: z.string().nullable(),
    sjr: z.string().nullable(),
    impactFactor: z.string().nullable(),
    citeScore: z.string().nullable(),
    qRankScs: z.string().nullable(),
    qRankWos: z.string().nullable(),
    pIssn: z.string().nullable(),
    eIssn: z.string().nullable(),
    pIsbn: z.string().nullable(),
    eIsbn: z.string().nullable(),
    link: z.union([z.string().url(), z.null()]),
});

export const CoAuthorSchema = z.object({
    authorId: z.string(),
    authorName: z.string().nullable(),
});

export const updatePublicationStatusSchema = z.object({
    citationId: z.string(),
    authorId: z.string(),
    status: z.boolean(),
    comments: z.string().nullable(),
});

export const PublicationWithMetaSchema = PublicationSchema.extend({
    status: z.boolean().nullable(),
    comments: z.string().nullable(),
    coAuthors: z.array(CoAuthorSchema),
});

export const publicationQuerySchema = z.object({
    authorId: z.string(),
});

export const exportPublicationSchema = z.object({
    citIDs: z.array(z.string()).nonempty("At least one row must be selected."),
    columnsVisible: z.array(z.string()).nonempty(
        "At least one column must be visible.",
    ),
});

export const publicationResponseSchema = z.array(PublicationSchema);

export const publicationWithMetaResponseSchema = z.array(
    PublicationWithMetaSchema,
);

export const validatedResponseSchema = z.object({
    validated: z.array(ReseargencePublicationSchema),
    nonValidated: z.array(PublicationSchema),
});

export type Publication = z.infer<typeof PublicationSchema>;
export type PublicationWithMeta = z.infer<typeof PublicationWithMetaSchema>;
export type CoAuthor = z.infer<typeof CoAuthorSchema>;
export type PublicationQuery = z.infer<typeof publicationQuerySchema>;
export type PublicationResponse = z.infer<typeof publicationResponseSchema>;
export type ValidatedResponse = z.infer<typeof validatedResponseSchema>;
export type PublicationWithMetaResponse = z.infer<
    typeof publicationWithMetaResponseSchema
>;
export type ReseargencePublication = z.infer<
    typeof ReseargencePublicationSchema
>;
