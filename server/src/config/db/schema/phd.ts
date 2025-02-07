import {
    pgTable,
    text,
    serial,
    pgEnum,
    integer,
    timestamp,
} from "drizzle-orm/pg-core";
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

export const phdApplicationReviewerType = pgEnum(
    "phd_application_reviewer_type",
    ["DAC_Member", "DRC_Member", "DRC_Convenor"]
);

export const phdApplicationStatus = pgTable("phd_application_status", {
    id: serial("id").primaryKey(),
    applicationId: integer("application_id")
        .notNull()
        .references(() => phdApplications.applicationId, {
            onDelete: "cascade",
        }),
    reviewer: phdApplicationReviewerType("reviewer").notNull(),
    status: phdApplicationStatusType("status").notNull().default("pending"),
    comment: text("comment"),
    createdAt: timestamp("created_at")
        .notNull()
        .default(sql`now()`),
});
