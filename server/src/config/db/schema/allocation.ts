import {
    pgTable,
    integer,
    text,
    serial,
    boolean,
    timestamp,
    pgEnum
} from "drizzle-orm/pg-core";
import { users } from "./admin.ts";

export const sectionTypeEnum = pgEnum(
    "section_type_enum",
    ["Lecture", "Tutorial", "Practical"]
);

export const oddEven = pgEnum(
    "odd_even_enum",
    ["odd", "even"]
);

export const allocationStatus = pgEnum(
    "allocation_status",
    ["notStarted", "ongoing", "completed", "suspended"]
);


export const allocation = pgTable("allocation", {
    instructorEmail: text("instructor_email")
        .notNull()
        .references(() => users.email), 

    semesterId: integer("semester_id")
        .notNull()
        .references(() => semester.id),

    courseCode: text("course_code")
        .notNull()
        .references(() => course.code),

    sectionType: sectionTypeEnum("section_type").notNull(),

    noOfSections: integer("no_of_sections").notNull()
});

export const course = pgTable("course", {
    code: text("code").primaryKey(), 
    name: text("name").notNull(),

    lectureSecCount: integer("lecture_sec_count").notNull(),
    tutSecCount: integer("tut_sec_count").notNull(),
    practicalSecCount: integer("practical_sec_count").notNull(),

    units: integer("units"), 
    hasLongPracticalSec: boolean("has_long_practical_sec").notNull(),

    isCDC: boolean("is_cdc").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
});


export const coursePreferences = pgTable("course_preferences", {
    id: serial("id").primaryKey(),

    instructorEmail: text("instructor_email")
        .notNull()
        .references(() => users.email),

    semesterId: integer("semester_id")
        .notNull()
        .references(() => semester.id),

    courseCode: text("course_code")
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

export const semester = pgTable("semester", {
    id: serial("id").primaryKey(),

    year: integer("year").notNull(),
    oddEven: oddEven("odd_even").notNull(),

    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    allocationDeadline: timestamp("allocation_deadline"),

    noOfElectivesPerInstructor: integer("no_of_electives_per_instructor"),
    noOfDisciplineCoursesPerInstructor: integer("no_of_discipline_courses_per_instructor"),
    
    hodAtStartOfSem: text("hod_at_start").references(() => users.email),
    dcaAtStartOfSem: text("dca_at_start").references(() => users.email),
    dcaMembersAtStartOfSem: text("dca_members").references(() => users.email),

    allocationStatus: allocationStatus("allocation_status"),

    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
});


