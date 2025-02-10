import { pgTable, text, serial, integer, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { phd, faculty } from "./admin.ts";

export const phdApplications = pgTable("phd_applications", {
    applicationId: serial("application_id").primaryKey(),
    email: text("email")
        .notNull()
        .references(() => phd.email, { onDelete: "cascade" }),
    fileId1: text("file_id_1")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    fileId2: text("file_id_2")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    fileId3: text("file_id_3")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    fileId4: text("file_id_4")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    fileId5: text("file_id_5")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
});


export const courses = pgTable("courses", {
    id: serial("id").primaryKey(),
    studentEmail: text("student_email")
        .notNull()
        .references(() => phd.email, { onDelete: "cascade" }),
    courseNames: text("course_names").array(),
    courseGrades: text("course_grades").array(),
    courseUnits: integer("course_units").array(),
});

export const deadline = pgTable("deadline", {
    drcMember: text("drc_member")
        .notNull()
        .references(() => faculty.email, { onDelete: "cascade" }),
    deadline: date("deadline").notNull(),
});

