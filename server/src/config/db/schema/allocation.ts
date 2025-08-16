import {
    pgTable,
    integer,
    text,
} from "drizzle-orm/pg-core";
import { sectionTypeEnum } from "./coursePreferences.ts"; 
import { users } from "./admin.ts";
import { semester } from "./semester.ts";
import { course } from "./course.ts";

export const allocation = pgTable("allocation", {
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

    noOfSections: integer("no_of_sections").notNull()
});
