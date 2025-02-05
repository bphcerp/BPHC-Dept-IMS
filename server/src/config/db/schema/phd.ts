import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { phd } from "./admin.ts";

export const phdApplications = pgTable("phd_applications", {
    applicationId: serial("application_id").primaryKey(),
    email: text("email")
        .notNull()
        .references(() => phd.email, { onDelete: "cascade" }),
    fileId1: text("file_id_1")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    fileId2: text("file_id_2")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    fileId3: text("file_id_3")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    fileId4: text("file_id_4")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    fileId5: text("file_id_5")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
});
