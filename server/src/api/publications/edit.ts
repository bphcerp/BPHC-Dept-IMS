import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    authorPublicationsTable,
    publicationsTable,
} from "@/config/db/schema/publications.ts";
import { eq, } from "drizzle-orm";
import { publicationsSchemas } from "lib";

const router = express.Router();
router.patch(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = publicationsSchemas.PublicationSchema.parse(req.body.publication);

        // Update the publication in the publications table
        await db
            .update(publicationsTable)
            .set({
                title: parsed.title,
                type: parsed.type,
                journal: parsed.journal,
                year: parsed.year,
                volume: parsed.volume,
                issue: parsed.issue,
                link: parsed.link,
                citations: parsed.citations,
                authorNames: parsed.authorNames
            })
            .where(eq(publicationsTable.citationId, parsed.citationId));

        // Update the author-publication relationship in the authorPublicationsTable
        await db
            .update(authorPublicationsTable)
            .set({
                status: null,
                comments: null,
            })
            .where(
                eq(authorPublicationsTable.citationId, parsed.citationId)
            );

        res.status(200).json({
            message: "Publication updated successfully",
        });
    })
);

export default router;
