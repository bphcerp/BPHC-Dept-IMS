import { pgTable, primaryKey, text, boolean, pgEnum } from "drizzle-orm/pg-core";


export const monthEnum = pgEnum("month", [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]) 

export const publicationsTable = pgTable("publications", {
    title: text("title").notNull(),
    type: text("type"),
    journal: text("journal"),
    volume: text("volume"),
    issue: text("issue"),
    month: monthEnum("month"),
    year: text("year"),
    link: text("link"),
    citations: text("citations"),
    citationId: text("citation_id").primaryKey(),
    authorNames: text("author_names"),
});

export const authorPublicationsTable = pgTable(
    "author_publications",
    {
        authorId: text("author_id").notNull(),
        citationId: text("citation_id").notNull(),
        authorName: text("author_name"),
        status: boolean("status"),
        comments: text("comments")
    },
    (table) => [primaryKey({ columns: [table.authorId, table.citationId] })]
);
