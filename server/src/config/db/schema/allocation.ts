import {
    pgTable,
    integer,
    text,
    timestamp,
    pgEnum,
    uuid,
    unique,
    index,
    boolean,
} from "drizzle-orm/pg-core";
import { users } from "./admin.ts";
import { v4 as uuidv4 } from "uuid";
import { allocationForm } from "./allocationFormBuilder.ts";
import { allocationSchemas } from "lib";

const {
    allocationStatuses,
    courseTypes,
    degreeTypes,
    sectionTypes,
    semesterTypes,
} = allocationSchemas;

export const sectionTypeEnum = pgEnum("section_type_enum", sectionTypes);

export const degreeTypeEnum = pgEnum("degree_type_enum", degreeTypes);

export const semesterTypeEnum = pgEnum("semester_type_enum", semesterTypes);
export const courseTypeEnum = pgEnum("course_type_enum", courseTypes);

export const allocationStatus = pgEnum("allocation_status", allocationStatuses);

export const masterAllocation = pgTable(
    "allocation_master_allocation",
    {
        id: uuid("id")
            .primaryKey()
            .$defaultFn(() => uuidv4()),

        semesterId: uuid("semester_id")
            .notNull()
            .references(() => semester.id, {
                onDelete: "restrict",
            }),

        ic: text("instructor_email")
            .notNull()
            .references(() => users.email),

        courseCode: text("course_code")
            .notNull()
            .references(() => course.code),
    },
    (table) => [unique().on(table.semesterId, table.courseCode)]
);

export const allocationSection = pgTable(
    "allocation_section",
    {
        id: uuid("id")
            .primaryKey()
            .$defaultFn(() => uuidv4()),
        type: sectionTypeEnum("section_type").notNull(),
        masterId: uuid("master_id")
            .notNull()
            .references(() => masterAllocation.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [index().on(table.masterId)]
);

export const allocationSectionInstructors = pgTable(
    "allocation_section_instructors",
    {
        sectionId: uuid("section_id")
            .notNull()
            .references(() => allocationSection.id, { onDelete: "cascade" }),
        instructorEmail: text("instructor_email")
            .notNull()
            .references(() => users.email, { onDelete: "set default" }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        unique().on(table.sectionId, table.instructorEmail),
        index().on(table.sectionId),
        index().on(table.instructorEmail),
    ]
);

export const course = pgTable("allocation_course", {
    code: text("code").primaryKey(),
    name: text("name").notNull(),

    lectureUnits: integer("lecture_units").notNull(),
    practicalUnits: integer("practical_units").notNull(),
    totalUnits: integer("total_units"),

    offeredAs: courseTypeEnum("offered_as").notNull(),
    offeredTo: degreeTypeEnum("offered_to").notNull(),
    offeredAlsoBy: text("offered_also_by").array(),
    fetchedFromTTD: boolean('fetched_from_ttd').default(true),

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
        semesterType: semesterTypeEnum("semester_type").notNull(),
        formId: uuid("form_id").references(() => allocationForm.id, {
            onDelete: "restrict",
        }),

        startDate: timestamp("start_date").notNull(),
        endDate: timestamp("end_date").notNull(),

        noOfElectivesPerInstructor: integer("no_of_electives_per_instructor").notNull(),
        noOfDisciplineCoursesPerInstructor: integer(
            "no_of_discipline_courses_per_instructor"
        ).notNull(),

        hodAtStartOfSemEmail: text("hod_at_start").references(
            () => users.email
        ),
        dcaConvenerAtStartOfSemEmail: text("dca_at_start").references(
            () => users.email
        ),
        allocationStatus: allocationStatus("allocation_status").default('notStarted').notNull(),

        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),

        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [unique().on(table.year, table.semesterType)]
);
