import {
    pgTable,
    text,
    serial,
    pgEnum,
    integer,
    timestamp,
} from "drizzle-orm/pg-core";
import { boolean } from "drizzle-orm/pg-core";
import { users } from "./admin.ts";
import { modules, formSchemas } from "lib";

export const modulesEnum = pgEnum("modules_enum", modules);
export const applicationStatusEnum = pgEnum(
    "application_status_enum",
    formSchemas.applicationStatuses
);

const baseStatus = {
    id: serial("id").primaryKey(),
    userEmail: text("user_email")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
    comments: text("comments"),
    updatedAs: text("updated_as").notNull(),
    status: boolean("status").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
};

export const applications = pgTable("applications", {
    id: serial("id").primaryKey(),
    module: modulesEnum("module").notNull(),
    fieldName: text("field_name"),
    userEmail: text("user_email")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
    status: applicationStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const fileFields = pgTable("file_fields", {
    id: serial("id").primaryKey(),
    module: modulesEnum("module").notNull(),
    fieldName: text("field_name"),
    userEmail: text("user_email")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
    fileId: integer("file")
        .notNull()
        .references(() => files.id, { onDelete: "cascade" }),
});

export const files = pgTable("files", {
    id: serial("id").primaryKey(),
    module: modulesEnum("module").notNull(),
    fieldName: text("field_name"),
    userEmail: text("user_email"),
    originalName: text("original_name"),
    mimetype: text("mimetype"),
    filePath: text("file_path").notNull(),
    size: integer("size"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const applicationStatus = pgTable("application_status", {
    ...baseStatus,
    applicationId: integer("application_id")
        .notNull()
        .references(() => applications.id, { onDelete: "cascade" }),
});
