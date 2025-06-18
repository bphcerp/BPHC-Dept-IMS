import db from "@/config/db/index.ts";
import { authorPublicationsTable } from "@/config/db/schema/publications.ts";
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { createNotifications } from "@/lib/todos/index.ts";
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
                comments: parsed.comments ?? null,
            })
            .where(
                and(
                    eq(authorPublicationsTable.citationId, parsed.citationId),
                    eq(authorPublicationsTable.authorId, parsed.authorId)
                )
            );

        if (parsed.comments) {
            const users = await getUsersWithPermission("publications:all");
            const content = [
                `• Citation ID: ${parsed.citationId}`,
                `• Author ID: ${parsed.authorId}`,
                `• Status: ${parsed.status}`,
                `• Comments: ${parsed.comments}`,   
            ].join('\n');
            if (users.length > 0){
                await createNotifications(
                    users.map((user) => ({
                        module: "Publications",
                        title: `Publication modification requested`,
                        content: content,
                        userEmail: user.email,
                    }))
                );
            };
        }

        res.status(200).json({
            message: "Publication status updated successfully",
        });
    })
);

export default router;
