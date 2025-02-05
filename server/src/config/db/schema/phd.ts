import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { phd } from "./admin.ts";

export const applications = pgTable("phd_applications", {
    application_id: serial("application_id").primaryKey(),
    email: text("email")
        .notNull()
        .references(() => phd.email, { onDelete: "cascade" }),
    file_id_1: text("file_id_1")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    file_id_2: text("file_id_2")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    file_id_3: text("file_id_3")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    file_id_4: text("file_id_4")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    file_id_5: text("file_id_5")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
});

export const applicationsRelations = relations(applications, ({ one }) => ({
    phdUser: one(phd, {
        fields: [applications.email],
        references: [phd.email],
        relationName: "phd",
    }),
}));
