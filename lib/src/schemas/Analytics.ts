import { z } from "zod";

export const timeGrouping = ["monthly", "yearly"] as const;
export type TimeGrouping = (typeof timeGrouping)[number];

const timeGroupingEnum = z.enum(timeGrouping);

export const graphEnumValues = ['line', 'bar'] as const;
export const graphDataType = ['total', 'cumulative'] as const;
export const graphMetricType = ['publications', 'citations', 'both'] as const;
export const yAxisEnumValues = ["Publications","Publications Over Time","Citations","Citations Over Time","Publication Type Breakdown","Author Contributions"] as const

export const GRAPH_OPTIONS : [{value: typeof graphEnumValues[number], label: string}, ...{value: string, label:string}[]] = [
    { value: "line", label: "Line Chart" },
    { value: "bar", label: "Bar Chart" },
] as const;

export type GraphValue = (typeof graphEnumValues)[number];

export const Y_AXIS_ALLOWED_TYPES : Record<typeof yAxisEnumValues[number], [string, ...string[]]> = {
    "Publications": ["bar"],
    "Publications Over Time": ["bar", "line"],
    "Citations": ["bar"],
    "Citations Over Time": ["bar", "line"],
    "Publication Type Breakdown": ["bar"],
    "Author Contributions": ["bar"]
} as const;

export const COLORS = [
    "#3b82f6", // blue
    "#22c55e", // green
    "#f97316", // orange
    "#a855f7", // violet
    "#ec4899", // pink
    "#14b8a6", // teal
    "#facc15", // yellow
] as const;

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

export const presentationTemplateSchema = z.object({
    title: z.string(),
    slides: z.number(),
    graphs: z.array(z.object({
        slideNumber: z.number(),
        yAxis: z.enum(yAxisEnumValues).nullable(),
        graphType: z.enum(graphEnumValues).nullable(),
        color: z.enum(COLORS).nullable(),
        dataType: z.enum(graphDataType).nullable(),
        metricType: z.enum(graphMetricType).nullable()
    }))
})

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

export const qualityIndexSchema = z.object({
    year: z.number().int(),
    q1Percent: z.number(),
    q2Percent: z.number(),
    q3Percent: z.number(),
    q4Percent: z.number(),
    noQuartilePercent: z.number(),
    avgImpactFactor: z.number(),
    highestImpactFactor: z.number(),
    avgCiteScore: z.number(),
    highestCiteScore: z.number(),
});

export const analyticsResponseSchema = z.object({
    publicationTimeSeries: z.array(timeSeriesDataSchema),
    citationTimeSeries: z.array(timeSeriesDataSchema),
    publicationTypeBreakdown: z.array(publicationTypeCountSchema),
    singleMetrics: singleMetricsSchema,
    authorContributions: z.array(authorContributionSchema),
    qualityIndex: z.array(qualityIndexSchema),
});

export type Template = z.infer<typeof presentationTemplateSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type TimeSeriesData = z.infer<typeof timeSeriesDataSchema>;
export type PublicationTypeCount = z.infer<typeof publicationTypeCountSchema>;
export type SingleMetrics = z.infer<typeof singleMetricsSchema>;
export type AuthorContribution = z.infer<typeof authorContributionSchema>;
export type QualityIndex = z.infer<typeof qualityIndexSchema>;
export type AnalyticsResponse = z.infer<typeof analyticsResponseSchema>;
