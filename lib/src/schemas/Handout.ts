import { z } from "zod";

export const getFacultyApplicationQuerySchema = z.object({
    applicationId: z.coerce.number(),
});

export type GetFacultyApplicationQuery = z.infer<
    typeof getFacultyApplicationQuerySchema
>;

export const getAllFacultyApplicationsQuerySchema = z.object({
    email: z.string().email(),
});

export type GetAllFacultyApplicationsQuery = z.infer<
    typeof getAllFacultyApplicationsQuerySchema
>;

export const dcaMemberCommentsRequestSchema = z.object({
    body: z.object({
        fieldReviews: z.object({
            courseCode: z.object({
                comments: z.string(),
                approved: z.boolean(),
            }),
            courseName: z.object({
                comments: z.string(),
                approved: z.boolean(),
            }),
            openBook: z.object({
                comments: z.string(),
                approved: z.boolean(),
            }),
            closedBook: z.object({
                comments: z.string(),
                approved: z.boolean(),
            }),
            midSem: z.object({
                comments: z.string(),
                approved: z.boolean(),
            }),
            compre: z.object({
                comments: z.string(),
                approved: z.boolean(),
            }),
            numComponents: z.object({
                comments: z.string(),
                approved: z.boolean(),
            }),
            frequency: z.object({
                comments: z.string(),
                approved: z.boolean(),
            }),
        }),
        review: z.string().nonempty(),
        status: z.boolean(),
    }),
    params: z.object({
        appid: z.coerce.number().refine((val) => !isNaN(Number(val))),
    }),
});

export type DCAMemberCommentsRequest = z.infer<
    typeof dcaMemberCommentsRequestSchema
>;

export const getReviewDCAMemberQuerySchema = z.object({
    email: z.string().email(),
    applicationId: z.coerce.number(),
});

export type GetReviewDCAMemberQuery = z.infer<
    typeof getReviewDCAMemberQuerySchema
>;

export const dcaConvenorCommentsSchema = z.object({
    body: z.object({
        review: z.string().nonempty(),
        status: z.boolean(),
    }),
    params: z.object({
        appid: z.coerce.number().refine((val) => !isNaN(Number(val))),
    }),
});

export type DCAConvenorComments = z.infer<typeof dcaConvenorCommentsSchema>;
