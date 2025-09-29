import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    authorPublicationsTable,
    publicationsTable,
} from "@/config/db/schema/publications.ts";
import { and, eq } from "drizzle-orm";
import { publicationsSchemas } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = publicationsSchemas.publicationQuerySchema.parse(
            req.query,
        );

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
                and(
                    eq(
                        authorPublicationsTable.citationId,
                        publicationsTable.citationId,
                    ),
                    eq(authorPublicationsTable.authorId, parsed.authorId),
                ),
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
                publicationsMap
                    .get(pub.citationId)!
                    .coAuthors.push(coAuthor);
            }
        }
        const data: publicationsSchemas.PublicationWithMetaResponse = Array.from(publicationsMap.values());
        res.status(200).json(data);
    }),
);

export default router;
