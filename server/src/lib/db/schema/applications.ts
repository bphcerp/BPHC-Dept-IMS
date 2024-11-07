import {
    pgTable,
    text,
    serial,
    timestamp,
    integer,
    boolean,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { pgEnum } from "drizzle-orm/pg-core";

export const applicationType = pgEnum("application_type", [
    "Conference Travel Approval",
    "Workshop Travel Approval",
    "Journal Pub. Chrgs Approval",
]);

export type ApplicationType = (typeof applicationType.enumValues)[number];

export const applications = pgTable("applications", {
    id: serial("id").primaryKey(),
    userEmail: text("user_email")
        .notNull()
        .references(() => users.email, { onDelete: "no action" }),
    type: applicationType("type").notNull(),
    createdAt: timestamp("started_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const uploads = pgTable("uploads", {
    id: serial("id").primaryKey(),
    applicationId: integer("application_id")
        .notNull()
        .references(() => applications.id, { onDelete: "cascade" }),
    field: text("field").notNull(),
    fileUrl: text("file_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const status = pgTable("status", {
    id: serial("id").primaryKey(),
    uploadId: integer("upload_id")
        .notNull()
        .references(() => uploads.id, { onDelete: "cascade" }),
    status: boolean("status").notNull(),
    comment: text("comment"),
    updatedBy: text("updated_by")
        .notNull()
        .references(() => users.email, { onDelete: "no action" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
