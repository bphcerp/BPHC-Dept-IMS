import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    authorPublicationsTable,
    publicationsTable,
} from "@/config/db/schema/publications.ts";
import { eq} from "drizzle-orm";
import { publicationsSchemas } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const response: publicationsSchemas.PublicationResponse = await db
            .select()
            .from(publicationsTable);

        // Use a map to accumulate both pubCount and citCount
        const yearMap: Record<string, { pubCount: number; citCount: number }> =
            {};

        let mostRecentYear: number | null = null;
        let totalCitations = 0;
        let citationCount = 0;
        const typeCounts: Record<string, number> = {};

        response.forEach((pub) => {
            const year = pub.year ? Number(pub.year) : null;
            const citations = pub.citations ? parseInt(pub.citations, 10) : 0;

            // ---- statsByYear ----
            if (year !== null) {
                if (!yearMap[year]) {
                    yearMap[year] = { pubCount: 0, citCount: 0 };
                }
                yearMap[year].pubCount += 1;
                yearMap[year].citCount += citations;

                // track most recent year
                if (!mostRecentYear || year > mostRecentYear) {
                    mostRecentYear = year;
                }
            }

            // ---- citation average ----
            if (citations > 0) {
                totalCitations += citations;
                citationCount++;
            }

            // ---- type counts ----
            if (pub.type) {
                const t = pub.type.toLowerCase();
                typeCounts[t] = (typeCounts[t] || 0) + 1;
            }
        });

        const statsByYear = Object.entries(yearMap).map(([year, values]) => ({
            year: Number(year),
            pubCount: values.pubCount,
            citCount: values.citCount,
        }));

        statsByYear.sort((a, b) => a.year - b.year);

        const avgCitations =
            citationCount > 0 ? totalCitations / citationCount : 0;

        res.status(200).json({
            statsByYear,
            mostRecentYear,
            averageCitationsPerPaper: avgCitations,
            publicationsByType: typeCounts,
        });
    })
);

export default router;
