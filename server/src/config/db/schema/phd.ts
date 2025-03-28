import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { phd } from "./admin.ts";

export const phdCourses = pgTable("phd_courses", {
    id: serial("id").primaryKey(),
    studentEmail: text("student_email")
        .notNull()
        .references(() => phd.email, { onDelete: "cascade" }),
    courseNames: text("course_names")
        .array()
        .default(sql`'{}'::text[]`),
    courseGrades: text("course_grades")
        .array()
        .default(sql`'{}'::text[]`),
    courseUnits: integer("course_units")
        .array()
        .default(sql`'{}'::integer[]`),
    courseIds: text("course_ids")
        .array()
        .default(sql`'{}'::text[]`),
});

export const phdSemesters = pgTable("phd_semesters", {
    id: serial("id").primaryKey(),
    year: text("year").notNull(),
    semesterNumber: integer("semester_number").notNull(), // 1 or 2
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });

  export const phdQualifyingExams = pgTable("phd_qualifying_exams", {
    id: serial("id").primaryKey(),
    semesterId: integer("semester_id")
      .notNull()
      .references(() => phdSemesters.id, { onDelete: "cascade" }),
    examName: text("exam_name").notNull(), 
    examStartDate: timestamp("exam_start_date").default(sql`NULL`),
    examEndDate: timestamp("exam_end_date").default(sql`NULL`),
    deadline: timestamp("deadline").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });