// routes/analytics.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";

import {
    generateTimePeriods,
    getValidatedPublications,
    calculateTimeSeries,
    calculatePublicationTypeBreakdown,
    calculateSingleMetrics,
    calculateAuthorContributions,
} from "@/lib/analytics/publications.ts";

import { analyticsSchemas } from "lib";
import db from "@/config/db/index.ts";
import { faculty } from "@/config/db/schema/admin.ts";

const router = express.Router();

// Main analytics endpoint
router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        // Validate query parameters
        const parsedQuery = {
            ...req.query,
            startMonth: req.query.startMonth
                ? Number(req.query.startMonth)
                : undefined,
            startYear: req.query.startYear
                ? Number(req.query.startYear)
                : undefined,
            endMonth: req.query.endMonth
                ? Number(req.query.endMonth)
                : undefined,
            endYear: req.query.endYear ? Number(req.query.endYear) : undefined,
        };

        const validatedQuery =
            analyticsSchemas.analyticsQuerySchema.parse(parsedQuery);

        const {
            startMonth,
            startYear,
            endMonth,
            endYear,
            grouping,
            authorIds,
        } = validatedQuery;

        // Generate the period buckets
        const periods = generateTimePeriods(
            startMonth,
            startYear,
            endMonth,
            endYear,
            grouping
        );

        // Fetch validated publications (dedup + range filter)
        const publications = await getValidatedPublications(
            authorIds,
            startMonth,
            startYear,
            endMonth,
            endYear
        );

        // Build publication count time series
        const publicationTimeSeries = calculateTimeSeries(
            publications,
            periods,
            grouping,
            () => 1
        );

        // Build citation time series
        const citationTimeSeries = calculateTimeSeries(
            publications,
            periods,
            grouping,
            ({ researgence }) =>
                Math.max(researgence.scs ?? 0, researgence.wos ?? 0)
        );

        // Breakdown by type
        const publicationTypeBreakdown =
            calculatePublicationTypeBreakdown(publications);

        // Single metrics
        const singleMetrics = await calculateSingleMetrics(authorIds);

        // Author contributions
        const authorContributions = await calculateAuthorContributions(
            authorIds,
            startMonth,
            startYear,
            endMonth,
            endYear
        );

        // Final response
        const response: analyticsSchemas.AnalyticsResponse = {
            publicationTimeSeries,
            citationTimeSeries,
            publicationTypeBreakdown,
            singleMetrics,
            authorContributions,
        };

        res.status(200).json(response);
    })
);

router.get(
    "/faculty",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const result = await db
            .select({
                authorId: faculty.authorId,
                name: faculty.name,
                email: faculty.email,
            })
            .from(faculty);

        res.json(result);
    })
);

export default router;
