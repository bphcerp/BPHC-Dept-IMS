import { z } from "zod";

export const timeGrouping = ["monthly", "yearly"] as const;
export type TimeGrouping = (typeof timeGrouping)[number];

const timeGroupingEnum = z.enum(timeGrouping);

export const analyticsQuerySchema = z
    .object({
        startMonth: z.number().int().min(1).max(12),
        startYear: z.number().int().min(1900).max(new Date().getFullYear()),
        endMonth: z.number().int().min(1).max(12),
        endYear: z.number().int().min(1900).max(new Date().getFullYear()),
        grouping: timeGroupingEnum,
        authorIds: z
            .array(z.string())
            .nonempty("At least one author must be selected"),
    })
    .refine(
        (data) => {
            const startDate = new Date(data.startYear, data.startMonth - 1);
            const endDate = new Date(data.endYear, data.endMonth - 1);
            return startDate <= endDate;
        },
        {
            message: "Start date must be before or equal to end date",
        }
    );

export const timeSeriesDataSchema = z.object({
    period: z.string(), // "2023-01" or "2023" depending on grouping
    year: z.number().int(),
    month: z.number().int().nullable(), // null for yearly grouping
    total: z.number().int(),
    cumulative: z.number().int(),
});

export const publicationTypeCountSchema = z.object({
    type: z.string(),
    count: z.number().int(),
});

export const singleMetricsSchema = z.object({
    totalPublicationsAllTime: z.number().int(),
    totalPublicationsLastYear: z.number().int(),
    totalPublicationsLastMonth: z.number().int(),
    averageCitationsPerPaper: z.number(),
});

export const authorContributionSchema = z.object({
    authorId: z.string(),
    name: z.string(),
    count: z.number().int(),
});

export const analyticsResponseSchema = z.object({
    publicationTimeSeries: z.array(timeSeriesDataSchema),
    citationTimeSeries: z.array(timeSeriesDataSchema),
    publicationTypeBreakdown: z.array(publicationTypeCountSchema),
    singleMetrics: singleMetricsSchema,
    authorContributions: z.array(authorContributionSchema),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type TimeSeriesData = z.infer<typeof timeSeriesDataSchema>;
export type PublicationTypeCount = z.infer<typeof publicationTypeCountSchema>;
export type SingleMetrics = z.infer<typeof singleMetricsSchema>;
export type AuthorContribution = z.infer<typeof authorContributionSchema>;
export type AnalyticsResponse = z.infer<typeof analyticsResponseSchema>;
