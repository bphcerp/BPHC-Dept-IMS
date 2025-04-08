import {
    pgTable,
    text,
    serial,
    pgEnum,
    integer,
    decimal,
    timestamp,
} from "drizzle-orm/pg-core";
import { boolean } from "drizzle-orm/pg-core";
import { users } from "./admin.ts";
import { modules } from "lib";

export const modulesEnum = pgEnum("modules_enum", modules);
export const applicationStatusEnum = pgEnum("application_status_enum", [
    "pending",
    "approved",
    "rejected",
]);

const baseField = {
    id: serial("id").primaryKey(),
    module: modulesEnum("module").notNull(),
    fieldName: text("field_name"),
    userEmail: text("user_email")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
};

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
    ...baseField,
    status: applicationStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const textFields = pgTable("text_fields", {
    ...baseField,
    value: text("value").notNull(),
});

export const numberFields = pgTable("number_fields", {
    ...baseField,
    value: decimal("value").notNull(),
});

export const dateFields = pgTable("date_fields", {
    ...baseField,
    value: timestamp("value", { withTimezone: true }).notNull(),
});

export const fileFields = pgTable("file_fields", {
    ...baseField,
    fileId: integer("file")
        .notNull()
        .references(() => files.id, { onDelete: "cascade" }),
});

export const files = pgTable("files", {
    ...baseField,
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

export const textFieldStatus = pgTable("text_field_status", {
    ...baseStatus,
    textField: integer("text_field")
        .notNull()
        .references(() => textFields.id, { onDelete: "cascade" }),
});

export const numberFieldStatus = pgTable("number_field_status", {
    ...baseStatus,
    numberField: integer("number_field")
        .notNull()
        .references(() => numberFields.id, { onDelete: "cascade" }),
});

export const dateFieldStatus = pgTable("date_field_status", {
    ...baseStatus,
    dateField: integer("date_field")
        .notNull()
        .references(() => dateFields.id, { onDelete: "cascade" }),
});

export const fileFieldStatus = pgTable("file_field_status", {
    ...baseStatus,
    fileField: integer("file_field")
        .notNull()
        .references(() => fileFields.id, { onDelete: "cascade" }),
});
