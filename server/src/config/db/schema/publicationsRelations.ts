import { relations } from "drizzle-orm";
import { authorPublicationsTable, publicationsTable } from "./publications.ts";
import { faculty } from "./admin.ts";

export const authorPublicationsRelations = relations(
    authorPublicationsTable,
    ({ one }) => ({
        author: one(faculty, {
            fields: [authorPublicationsTable.authorId],
            references: [faculty.authorId],
        }),
        publication: one(publicationsTable, {
            fields: [authorPublicationsTable.citationId],
            references: [publicationsTable.citationId],
        }),
    })
);
