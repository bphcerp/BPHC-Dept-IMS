import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { users } from "./admin.ts";
import { textFields, fileFields } from "./form.ts";

export const courseHandoutRequests = pgTable("course_handout_requests", {
    id: serial("id").primaryKey(),
    userEmail: text("user_email")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
    courseCode: integer("course_code").references(() => textFields.id, {
        onDelete: "set null",
    }),
    courseName: integer("course_name").references(() => textFields.id, {
        onDelete: "set null",
    }),
    courseStrength: integer("course_strength").references(() => textFields.id, {
        onDelete: "set null",
    }),
    openBook: integer("open_book").references(() => textFields.id, {
        onDelete: "set null",
    }),
    closedBook: integer("closed_book").references(() => textFields.id, {
        onDelete: "set null",
    }),
    midSem: integer("mid_sem").references(() => textFields.id, {
        onDelete: "set null",
    }),
    compre: integer("compre").references(() => textFields.id, {
        onDelete: "set null",
    }),
    numComponents: integer("num_components").references(() => textFields.id, {
        onDelete: "set null",
    }),
    frequency: integer("frequency").references(() => textFields.id, {
        onDelete: "set null",
    }),
    handoutFilePath: integer("handout_file_path").references(() => fileFields.id, {
        onDelete: "set null",
    }),
});
