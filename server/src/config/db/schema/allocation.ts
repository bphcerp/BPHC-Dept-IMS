import {
    pgTable,
    integer,
    text,
    timestamp,
    pgEnum,
    uuid,
    unique,
} from "drizzle-orm/pg-core";
import { users } from "./admin.ts";
import { v4 as uuidv4 } from "uuid";
import { allocationForm } from "./allocationFormBuilder.ts";

export const sectionTypeEnum = pgEnum("section_type_enum", [
    "LECTURE",
    "TUTORIAL",
    "PRACTICAL",
]);

export const degreeTypeEnum = pgEnum("degree_type_enum", ["FD", "HD"]);

export const oddEven = pgEnum("odd_even_enum", ["odd", "even"]);
export const courseTypeEnum = pgEnum("course_type_enum", ["CDC", "Elective"]);

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
});

export const allocationSection = pgTable("allocation_section", {
    id: uuid("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),
    number: integer("section_name").notNull(),
    type: sectionTypeEnum("section_type").notNull(),
    masterId: uuid("master_id")
        .notNull()
        .references(() => masterAllocation.id, { onDelete: "cascade" }),
});

export const allocationSectionInstructors = pgTable(
    "allocation_section_instructors",
    {
        sectionId: uuid("section_id")
            .notNull()
            .references(() => allocationSection.id, { onDelete: "cascade" }),
        instructorEmail: text("instructor_email")
            .notNull()
            .references(() => users.email, { onDelete: "cascade" }),
    }
);

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

    lectureUnits: integer("lecture_units").notNull(),
    practicalUnits: integer("practical_units").notNull(),
    totalUnits: integer("total_units"),

    offeredAs: courseTypeEnum("offered_as").notNull(),
    offeredTo: degreeTypeEnum("offered_to").notNull(),
    offeredAlsoBy: text("offered_also_by").array(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const semester = pgTable(
    "allocation_semester",
    {
        id: uuid("id")
            .primaryKey()
            .$defaultFn(() => uuidv4()),
        year: integer("year").notNull(),
        oddEven: oddEven("odd_even").notNull(),
        formId: uuid("form_id").references(() => allocationForm.id, {
            onDelete: "restrict",
        }),

        startDate: timestamp("start_date").notNull(),
        endDate: timestamp("end_date").notNull(),

        noOfElectivesPerInstructor: integer("no_of_electives_per_instructor"),
        noOfDisciplineCoursesPerInstructor: integer(
            "no_of_discipline_courses_per_instructor"
        ),

        hodAtStartOfSemEmail: text("hod_at_start").references(
            () => users.email
        ),
        dcaConvenerAtStartOfSemEmail: text("dca_at_start").references(
            () => users.email
        ),
        allocationStatus: allocationStatus("allocation_status"),

        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),

        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [unique().on(table.year, table.oddEven)]
);
