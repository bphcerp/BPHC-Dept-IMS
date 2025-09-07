import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import {
    authorPublicationsTable,
    publicationsTable,
} from "@/config/db/schema/publications.ts";
import { eq } from "drizzle-orm";
import { publicationsSchemas } from "lib";
import { createNotifications } from "@/lib/todos/index.ts";
import { faculty } from "@/config/db/schema/admin.ts";

const router = express.Router();
router.patch(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = publicationsSchemas.PublicationWithMetaSchema.parse(
            req.body.publication
        );

        // Update the publication in the publications table
        await db
            .update(publicationsTable)
            .set({
                title: parsed.title,
                type: parsed.type,
                journal: parsed.journal,
                month: parsed.month,
                year: parsed.year,
                volume: parsed.volume,
                issue: parsed.issue,
                link: parsed.link,
                citations: parsed.citations,
                authorNames: parsed.authorNames,
            })
            .where(eq(publicationsTable.citationId, parsed.citationId));

        // Update the author-publication relationship in the authorPublicationsTable
        await db
            .update(authorPublicationsTable)
            .set({
                status: parsed.status,
                comments: parsed.comments,
            })
            .where(eq(authorPublicationsTable.citationId, parsed.citationId));

        const authorIds = await db
            .select({
                authorId: authorPublicationsTable.authorId,
            })
            .from(authorPublicationsTable)
            .where(eq(authorPublicationsTable.citationId, parsed.citationId))
            .limit(1);

        const emailId = await db
            .select({
                email: faculty.email,
            })
            .from(faculty)
            .where(eq(faculty.authorId, authorIds[0]?.authorId));

        if (emailId[0]?.email) {
            await createNotifications([
                {
                    module: "Publications",
                    title: `Your publication has been updated`,
                    content: `Your publication with ID "${parsed.citationId}" has been updated`,
                    userEmail: emailId[0]?.email,
                },
            ]);
        }

        res.status(200).json({
            message: "Publication updated successfully",
        });
    })
);

export default router;
