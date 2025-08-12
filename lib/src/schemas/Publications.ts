import { z } from "zod";

export const PublicationSchema = z.object({
    citationId: z.string(),
    title: z.string(),
    type: z.string().nullable(),
    status: z.boolean().nullable(),
    journal: z.string().nullable(),
    volume: z.string().nullable(),
    issue: z.string().nullable(),
    year: z.string().nullable(),
    link: z.string().nullable(),
    citations: z.string().nullable(),
    authorNames: z.string().nullable(),
    comments: z.string().nullable(),
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

export const PublicationWithCoAuthorsSchema = PublicationSchema.extend({
    coAuthors: z.array(CoAuthorSchema),
});

export const PublicationRowSchema = z.object({
    publication: PublicationSchema,
    authorId: z.string(),
    authorName: z.string().nullable(),
    status: z.boolean().nullable(),
    comments: z.string().nullable(),
});

export const publicationQuerySchema = z.object({
    authorId: z.string(),
});

export const exportPublicationSchema = z.object({
    citIDs: z.array(z.string()).nonempty("At least one row must be selected."),
    columnsVisible: z.array(z.string()).nonempty("At least one column must be visible.")
});

export const publicationResponseSchema = z.object({
    publications: z.array(PublicationWithCoAuthorsSchema),
});

export type Publication = z.infer<typeof PublicationSchema>;
export type CoAuthor = z.infer<typeof CoAuthorSchema>;
export type PublicationWithCoAuthors = z.infer<
    typeof PublicationWithCoAuthorsSchema
>;
export type PublicationRow = z.infer<typeof PublicationRowSchema>;
export type PublicationQuery = z.infer<typeof publicationQuerySchema>;
export type PublicationResponse = z.infer<typeof publicationResponseSchema>;
