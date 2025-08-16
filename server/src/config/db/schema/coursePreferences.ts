import {
    pgTable,
    serial,
    integer,
    text,
    timestamp,
    pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./admin.ts";
import { semester } from "./semester.ts";
import { course } from "./course.ts";

export const sectionTypeEnum = pgEnum(
    "section_type_enum",
    ["L", "T", "P"]
);

export const coursePreferences = pgTable("course_preferences", {
    id: serial("id").primaryKey(),

    instructorId: integer("instructor_id")
        .notNull()
        .references(() => users.email),

    semesterId: integer("semester_id")
        .notNull()
        .references(() => semester.id),

    courseId: text("course_id")
        .notNull()
        .references(() => course.code), 

    sectionType: sectionTypeEnum("section_type").notNull(),

    preference: integer("preference").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
});
