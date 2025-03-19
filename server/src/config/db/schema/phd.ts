import { pgTable, text, serial, timestamp, integer ,  uuid} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { phd } from "./admin.ts";

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

export const phdConfig = pgTable("phd_config", {
    key: text("key").notNull(),
    value: timestamp("value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const phdDocuments = pgTable("phdDocuments", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    fileUrl: text("fileUrl").notNull(),
    formName: text("formName").notNull(),
    applicationType: text("applicationType").notNull(),
    uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export const phdSemesters = pgTable("phd_semesters", {
    id: serial("id").primaryKey(),
    year: integer("year").notNull(),
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
    deadline: timestamp("deadline").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });