import {
    pgTable,
    integer,
    text,
    boolean,
    timestamp,
    pgEnum,
    uuid,
} from "drizzle-orm/pg-core";
import { users } from "./admin.ts";
import { v4 as uuidv4 } from "uuid";
import { number } from "zod";

export const sectionTypeEnum = pgEnum("section_type_enum", [
    "Lecture",
    "Tutorial",
    "Practical",
]);

export const oddEven = pgEnum("odd_even_enum", ["odd", "even"]);

export const allocationStatus = pgEnum("allocation_status", [
    "notStarted",
    "ongoing",
    "completed",
    "suspended",
]);

export const masterAllocation = pgTable("allocation_master_allocation", {
    id: uuid("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),

    semesterId: uuid("semester_id").references(() => semester.id, {
        onDelete: "cascade",
    }),

    ic: text("instructor_email")
        .notNull()
        .references(() => users.email),

    courseCode: text("course_code")
        .notNull()
        .references(() => course.code),

    lectures: uuid("lectures")
        .notNull()
        .references(() => allocationSection.id),
    tutorials: uuid("tutorials")
        .notNull()
        .references(() => allocationSection.id),
    practicals: uuid("practicals")
        .notNull()
        .references(() => allocationSection.id),
});

export const allocationSection = pgTable("allocation_section", {
    id: uuid("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),
    number: integer("section_name").notNull(),
    credits: integer("credits").notNull(),
    type: sectionTypeEnum("section_type").notNull(),
    instructorEmails: text("instructor_emails").array().notNull(),
});

export const allocation = pgTable("allocation_allocation_result", {
    id: uuid("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),
    instructorEmail: text("instructor_email")
        .notNull()
        .references(() => users.email),

    semesterId: uuid("semester_id")
        .notNull()
        .references(() => semester.id),

    courseCode: text("course_code")
        .notNull()
        .references(() => course.code),

    sectionType: sectionTypeEnum("section_type").notNull(),

    noOfSections: integer("no_of_sections").notNull(),
    allocatedOn: timestamp("allocated_on", { withTimezone: true }).defaultNow(),
    updatedOn: timestamp("updated_on", { withTimezone: true }).defaultNow(),
});

export const course = pgTable("allocation_course", {
    code: text("code").primaryKey(),
    name: text("name").notNull(),

    lectureSecCount: integer("lecture_sec_count").notNull(),
    tutSecCount: integer("tut_sec_count").notNull(),
    practicalSecCount: integer("practical_sec_count").notNull(),

    units: integer("units"),
    hasLongPracticalSec: boolean("has_long_practical_sec").default(false),

    isCDC: boolean("is_cdc").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const semester = pgTable("allocation_semester", {
    id: uuid("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),
    year: integer("year").notNull(),
    oddEven: oddEven("odd_even").notNull(),

    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    allocationDeadline: timestamp("allocation_deadline"),

    noOfElectivesPerInstructor: integer("no_of_electives_per_instructor"),
    noOfDisciplineCoursesPerInstructor: integer(
        "no_of_discipline_courses_per_instructor"
    ),

    hodAtStartOfSemEmail: text("hod_at_start").references(() => users.email),
    dcaConvenerAtStartOfSemEmail: text("dca_at_start").references(
        () => users.email
    ),
    allocationStatus: allocationStatus("allocation_status"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
