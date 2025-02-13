import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { users } from "./admin.ts";
import { boolean } from "drizzle-orm/pg-core";

export const textFields = pgTable("text_fields", {
    id: serial("id").primaryKey(),
    value: text("value").notNull(),
});

export const fileFields = pgTable("file_fields", {
    id: serial("id").primaryKey(),
    file: serial("file")
        .notNull()
        .references(() => files.id, { onDelete: "cascade" }),
    module: text("module").notNull(),
});

export const textFieldStatus = pgTable("text_field_status", {
    id: serial("id").primaryKey(),
    userEmail: text("user_email")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
    comments: text("comments").notNull(),
    updatedAs: text("updated_as").notNull(),
    textField: text("text_field")
        .notNull()
        .references(() => textFields.id, { onDelete: "cascade" }),
    status: boolean("status").notNull(),
});

export const fileFieldStatus = pgTable("file_field_status", {
    id: serial("id").primaryKey(),
    userEmail: text("user_email")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
    comments: text("comments").notNull(),
    updatedAs: text("updated_as").notNull(),
    fileField: text("text_field")
        .notNull()
        .references(() => fileFields.id, { onDelete: "cascade" }),
    status: boolean("status").notNull(),
});

export const files = pgTable("files", {
    id: serial("id").primaryKey(),
    filePath: text("file_path").notNull(),
    created_at: text("created_at").notNull(),
    uploaded_by: text("uploaded_by")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
});
