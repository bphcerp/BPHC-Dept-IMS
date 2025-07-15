import { pgTable, text, timestamp, pgEnum, serial } from "drizzle-orm/pg-core";
import { faculty } from "./admin.ts";

export const degreeProgramEnum = pgEnum("degree_program", [
    "B.Tech. Engineering Technology",
    "M.Tech. Design Engineering",
    "B.Tech. Power Engineering",
    "MBA in Quality Management",
    "MBA in Manufacturing Management",
    "M.Tech. Quality Management",
    "M.Tech. Manufacturing Management",
]);

export const wilpProject = pgTable("wilp_project", {
    id: serial("id").primaryKey(),
    studentId: text("student_id").notNull(),
    discipline: text("discipline").notNull(),
    studentName: text("student_name").notNull(),
    organization: text("organization").notNull(),
    degreeProgram: degreeProgramEnum("degree_program").notNull(),
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
