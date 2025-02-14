import { pgTable, text, serial, pgEnum, integer } from "drizzle-orm/pg-core";
import { boolean } from "drizzle-orm/pg-core";
import { users } from "./admin.ts";
import { modules } from "lib";

export const modulesEnum = pgEnum("modules", modules);

export const textFields = pgTable("text_fields", {
    id: serial("id").primaryKey(),
    value: text("value").notNull(),
    module: modulesEnum("module").notNull(),
});

export const fileFields = pgTable("file_fields", {
    id: serial("id").primaryKey(),
    file: integer("file")
        .notNull()
        .references(() => files.id, { onDelete: "cascade" }),
    module: modulesEnum("module").notNull(),
});

export const textFieldStatus = pgTable("text_field_status", {
    id: serial("id").primaryKey(),
    userEmail: text("user_email")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
    comments: text("comments").notNull(),
    updatedAs: text("updated_as").notNull(),
    textField: integer("text_field")
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
    fileField: integer("file_field")
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
