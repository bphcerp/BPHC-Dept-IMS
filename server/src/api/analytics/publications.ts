import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { publicationsTable } from "@/config/db/schema/publications.ts";

import { publicationsSchemas } from "lib";
const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const response: publicationsSchemas.PublicationResponse = await db
            .select()
            .from(publicationsTable);

        const yearMap: Record<string, { pubCount: number; citCount: number }> =
            {};
        const nameMap: Record<string, number> = {};
        let mostRecentYear: number | null = null;
        let totalCitations = 0;
        let citationCount = 0;
        const typeCounts: Record<string, number> = {};

        response.forEach((pub) => {
            const year = pub.year ? Number(pub.year) : null;
            const citations = pub.citations ? parseInt(pub.citations, 10) : 0;
            const names = pub.authorNames
                .trim()
                .split(",")
                .map((n) => n.trim());
            names.forEach((name) => {
                if (name) {
                    nameMap[name] = (nameMap[name] || 0) + 1;
                }
            });
            if (year !== null) {
                if (!yearMap[year]) {
                    yearMap[year] = { pubCount: 0, citCount: 0 };
                }
                yearMap[year].pubCount += 1;
                yearMap[year].citCount += citations;

                if (!mostRecentYear || year > mostRecentYear) {
                    mostRecentYear = year;
                }
            }

            if (citations > 0) {
                totalCitations += citations;
                citationCount++;
            }

            if (pub.type) {
                const t = pub.type.toLowerCase();
                typeCounts[t] = (typeCounts[t] || 0) + 1;
            }
        });
        const topNames = Object.entries(nameMap)
            .sort((a, b) => b[1] - a[1])
            .map((pub) => ({
                name: pub[0],
                count: pub[1],
            }));

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
            topAuthors: topNames.slice(0, 5),
        });
    })
);

export default router;
