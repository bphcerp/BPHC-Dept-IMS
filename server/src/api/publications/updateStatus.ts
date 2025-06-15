import db from "@/config/db/index.ts";
import { authorPublicationsTable } from "@/config/db/schema/publications.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { and, eq } from "drizzle-orm";
import express from "express";
import { publicationsSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = publicationsSchemas.updatePublicationStatusSchema.parse(
            req.body
        );
        await db
            .update(authorPublicationsTable)
            .set({
                status: parsed.status,
                comments: parsed.comments ? parsed.comments : null,
            })
            .where(
                and(
                    eq(authorPublicationsTable.citationId, parsed.citationId),
                    eq(authorPublicationsTable.authorId, parsed.authorId)
                )
            );

        res.status(200).json({
            message: "Publication status updated successfully",
        });
    })
);

export default router;
