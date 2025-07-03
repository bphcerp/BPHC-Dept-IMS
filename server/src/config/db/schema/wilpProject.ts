import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";
import { faculty } from "./admin.ts";

export const wilpProject = pgTable("wilp_project", {
    id: uuid("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),
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

    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
