import { pgTable, text, serial, pgEnum, integer } from "drizzle-orm/pg-core";
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

export const phdApplicationStatusType = pgEnum("phd_application_status_type", [
    "approved",
    "rejected",
    "requested",
    "pending",
]);

export const phdApplicationStatus = pgTable("phd_application_status", {
    id: serial("id").primaryKey(), // Unique primary key for the table
    applicationId: integer("application_id")
        .notNull()
        .references(() => phdApplications.applicationId, { onDelete: "cascade" }), // Foreign key
    status_drc_convenor: phdApplicationStatusType("status_drc_convenor")
        .notNull()
        .default("pending"),
    drc_convenor_comment: text("drc_convenor_comment"),
    status_drc_member: phdApplicationStatusType("status_drc_member")
        .notNull()
        .default("pending"),
    drc_member_comment: text("drc_member_comment"),
    status_dac_member: phdApplicationStatusType("status_dac_member")
        .notNull()
        .default("pending"),
    dac_member_comment: text("dac_member_comment"),
});
