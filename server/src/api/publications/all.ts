import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    authorPublicationsTable,
    publicationsTable,
    researgencePublications,
} from "@/config/db/schema/publications.ts";
import { eq, isNull } from "drizzle-orm";
import type { publicationsSchemas } from "lib";

const router = express.Router();

router.get(
    "/validated/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const data: publicationsSchemas.ValidatedResponse = {
            validated: (
                await db
                    .select()
                    .from(researgencePublications)
                    .innerJoin(
                        publicationsTable,
                        eq(
                            researgencePublications.publicationTitle,
                            publicationsTable.title
                        )
                    )
            ).map((row) => row.researgence),

            nonValidated: (
                await db
                    .select()
                    .from(publicationsTable)
                    .leftJoin(
                        researgencePublications,
                        eq(
                            researgencePublications.publicationTitle,
                            publicationsTable.title
                        )
                    )
                    .where(isNull(researgencePublications.authors))
            ).map((row) => row.publications),
        };
        res.status(200).json(data);
    })
);

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const response: publicationsSchemas.PublicationResponse = await db
            .select()
            .from(publicationsTable);
        res.status(200).json(response);
    })
);

router.get(
    "/meta/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const allData = await db
            .select({
                publication: publicationsTable,
                authorId: authorPublicationsTable.authorId,
                authorName: authorPublicationsTable.authorName,
                status: authorPublicationsTable.status,
                comments: authorPublicationsTable.comments,
            })
            .from(authorPublicationsTable)
            .innerJoin(
                publicationsTable,
                eq(
                    authorPublicationsTable.citationId,
                    publicationsTable.citationId
                )
            );

        if (!allData.length) {
            res.status(200).json([]);
            return;
        }

        const publicationsMap = new Map<
            string,
            publicationsSchemas.PublicationWithMeta
        >();

        for (const row of allData) {
            const pub = row.publication;
            const coAuthor: publicationsSchemas.CoAuthor = {
                authorId: row.authorId,
                authorName: row.authorName,
            };
            if (!publicationsMap.has(pub.citationId)) {
                publicationsMap.set(pub.citationId, {
                    ...pub,
                    status: row.status ?? null,
                    comments: row.comments ?? null,
                    coAuthors: [coAuthor],
                });
            } else {
                publicationsMap.get(pub.citationId)!.coAuthors.push({
                    authorId: row.authorId,
                    authorName: row.authorName,
                });
            }
        }

        const data: publicationsSchemas.PublicationWithMetaResponse =
            Array.from(publicationsMap.values());
        res.status(200).json(data);
    })
);

export default router;
