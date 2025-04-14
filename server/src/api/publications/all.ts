import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    authorPublicationsTable,
    publicationsTable,
} from "@/config/db/schema/publications.ts";
import { eq, inArray } from "drizzle-orm";
import { publicationsSchemas } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const authoredCitationIds = await db
            .select({ citationId: authorPublicationsTable.citationId })
            .from(authorPublicationsTable);

        const citationIds = authoredCitationIds.map(
            (entry) => entry.citationId
        );

        let data: publicationsSchemas.PublicationResponse = {
            publications: [],
        };

        if (citationIds.length !== 0) {
            const allData = await db
                .select({
                    publication: publicationsTable,
                    authorId: authorPublicationsTable.authorId,
                    authorName: authorPublicationsTable.authorName,
                })
                .from(authorPublicationsTable)
                .innerJoin(
                    publicationsTable,
                    eq(
                        authorPublicationsTable.citationId,
                        publicationsTable.citationId
                    )
                )
                .where(
                    inArray(authorPublicationsTable.citationId, citationIds)
                );

            const publicationsMap = new Map<
                string,
                publicationsSchemas.PublicationWithCoAuthors
            >();

            for (const row of allData as publicationsSchemas.PublicationRow[]) {
                const pub = row.publication;
                const coAuthor: publicationsSchemas.CoAuthor = {
                    authorId: row.authorId,
                    authorName: row.authorName,
                };

                if (!publicationsMap.has(pub.citationId)) {
                    publicationsMap.set(pub.citationId, {
                        ...pub,
                        coAuthors: [coAuthor],
                    });
                } else {
                    publicationsMap
                        .get(pub.citationId)!
                        .coAuthors.push(coAuthor);
                }
            }

            const response = {
                publications: Array.from(publicationsMap.values()),
            };

            data = response;
        }

        res.status(200).json(data);
    })
);

export default router;
