import {
    pgTable,
    serial,
    integer,
    text,
    timestamp,
    pgEnum,
} from "drizzle-orm/pg-core";
import { handoutSchemas } from "lib";

export const oddEven = pgEnum(
    "odd_even_enum",
    ["odd", "even"]
);

export const allocationStatus = pgEnum(
    "allocation_status",
    ["notStarted", "ongoing", "completed", "suspended"]
);

export const categoryEnum = pgEnum("category_enum", handoutSchemas.categories);

export const semester = pgTable("semester", {
    id: serial("id").primaryKey(),

    year: integer("year").notNull(),
    oddEven: oddEven("odd_even").notNull(),

    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    allocationDeadline: timestamp("allocation_deadline"),

    noOfElectivesPerInstructor: integer("no_of_electives_per_instructor"),
    noOfDisciplineCoursesPerInstructor: integer("no_of_discipline_courses_per_instructor"),

    hodAtStartOfSem: text("hod_at_start"),
    dcaAtStartOfSem: text("dca_at_start"),
    dcaMembersAtStartOfSem: text("dca_members"),

    allocationStatus: allocationStatus("allocation_status"),

    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
});
