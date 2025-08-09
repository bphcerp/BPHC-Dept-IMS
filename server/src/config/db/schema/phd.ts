import {
    pgTable,
    text,
    serial,
    timestamp,
    integer,
    unique,
    pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { phd } from "./admin.ts";
import { phdSchemas } from "lib";
import { files } from "./form.ts";

export const phdExamApplicationStatus = pgEnum(
    "phd_exam_application_status",
    phdSchemas.phdExamApplicationStatuses
);

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

export const phdSemesters = pgTable(
    "phd_semesters",
    {
        id: serial("id").primaryKey(),
        year: text("year").notNull(),
        semesterNumber: integer("semester_number").notNull(),
        startDate: timestamp("start_date", { withTimezone: true }).notNull(),
        endDate: timestamp("end_date", { withTimezone: true }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [unique().on(table.year, table.semesterNumber)]
);

export const phdQualifyingExams = pgTable(
    "phd_qualifying_exams",
    {
        id: serial("id").primaryKey(),
        semesterId: integer("semester_id")
            .notNull()
            .references(() => phdSemesters.id, { onDelete: "cascade" }),
        examName: text("exam_name").notNull(),
        examStartDate: timestamp("exam_start_date", {
            withTimezone: true,
        }).notNull(),
        examEndDate: timestamp("exam_end_date", {
            withTimezone: true,
        }).notNull(),
        submissionDeadline: timestamp("submission_deadline", {
            withTimezone: true,
        }).notNull(),
        vivaDate: timestamp("viva_date", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [unique().on(table.semesterId, table.examName)]
);

export const phdExamApplications = pgTable("phd_exam_applications", {
    id: serial("id").primaryKey(),
    examId: integer("exam_id")
        .notNull()
        .references(() => phdQualifyingExams.id, { onDelete: "cascade" }),
    studentEmail: text("student_email")
        .notNull()
        .references(() => phd.email, { onDelete: "cascade" }),
    status: phdExamApplicationStatus("status").notNull().default("applied"),
    comments: text("comments"),
    qualifyingArea1: text("qualifying_area_1")
        .notNull()
        .references(() => phdSubAreas.subArea, { onDelete: "cascade" }),
    qualifyingArea2: text("qualifying_area_2")
        .notNull()
        .references(() => phdSubAreas.subArea, { onDelete: "cascade" }),
    qualifyingArea1SyllabusFileId: integer(
        "qualifying_area_1_syllabus_file_id"
    ).references(() => files.id, { onDelete: "set null" }),
    qualifyingArea2SyllabusFileId: integer(
        "qualifying_area_2_syllabus_file_id"
    ).references(() => files.id, { onDelete: "set null" }),
    tenthReportFileId: integer("tenth_report_file_id").references(
        () => files.id,
        { onDelete: "set null" }
    ),
    twelfthReportFileId: integer("twelfth_report_file_id").references(
        () => files.id,
        { onDelete: "set null" }
    ),
    undergradReportFileId: integer("undergrad_report_file_id").references(
        () => files.id,
        { onDelete: "set null" }
    ),
    mastersReportFileId: integer("masters_report_file_id").references(
        () => files.id,
        { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const phdSubAreas = pgTable("phd_sub_areas", {
    subArea: text("sub_area").notNull().primaryKey(),
});

export const phdExaminerSuggestions = pgTable("phd_examiner_suggestions", {
    id: serial("id").primaryKey(),
    applicationId: integer("application_id")
        .notNull()
        .references(() => phdExamApplications.id, { onDelete: "cascade" }),
    subArea: text("sub_area")
        .notNull()
        .references(() => phdSubAreas.subArea, { onDelete: "cascade" }),
    suggestedExaminers: text("suggested_examiners")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    comments: text("comments"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const phdExaminerAssignments = pgTable("phd_examiner_assignments", {
    id: serial("id").primaryKey(),
    applicationId: integer("application_id")
        .notNull()
        .references(() => phdExamApplications.id, { onDelete: "cascade" }),
    subArea: text("sub_area")
        .notNull()
        .references(() => phdSubAreas.subArea, { onDelete: "cascade" }),
    examinerEmail: text("examiner_email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
