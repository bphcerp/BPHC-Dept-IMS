import { pgTable, text, serial, pgEnum } from "drizzle-orm/pg-core";
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

export const phdStatusType = pgEnum("phd_status_type", [
    "approved",
    "rejected",
    "requested",
    "pending",
]);

export const phdStatus = pgTable("phd_status", {
    applicationId: serial("application_id")
        .primaryKey()
        .references(() => phdApplications.applicationId, { onDelete: "cascade" }),
    status_drc_convenor: phdStatusType("status_drc_convenor")
        .notNull()
        .default("pending"),
    drc_convenor_comment: text("drc_convenor_comment"),
    status_drc_member: phdStatusType("status_drc_member")
        .notNull()
        .default("pending"),
    drc_member_comment: text("drc_member_comment"),
    status_dac_member: phdStatusType("status_dac_member")
        .notNull()
        .default("pending"),
    dac_member_comment: text("dac_member_comment"),
});
