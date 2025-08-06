import {
    pgTable,
    text,
    timestamp,
    serial,
    integer,
} from "drizzle-orm/pg-core";
import { faculty } from "./admin.ts";

export const wilpProject = pgTable("wilp_project", {
    id: serial("id").primaryKey(),
    studentId: text("student_id").notNull(),
    discipline: text("discipline").notNull(),
    studentName: text("student_name").notNull(),
    organization: text("organization").notNull(),
    degreeProgram: text("degree_program").notNull(),
    facultyEmail: text("faculty_email").references(() => faculty.email, {
        onDelete: "set null",
    }),
    researchArea: text("research_area").notNull(),
    dissertationTitle: text("dissertation_title").notNull(),

    reminder: timestamp("reminder", { withTimezone: true }).notNull(),
    deadline: timestamp("deadline", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});

export const wilpProjectsRange = pgTable("wilp_projects_range", {
    id: serial("id").primaryKey(),
    min: integer("min").notNull(),
    max: integer("max").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
