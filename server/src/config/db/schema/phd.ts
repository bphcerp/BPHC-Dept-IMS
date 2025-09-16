import {
    pgTable,
    text,
    serial,
    timestamp,
    integer,
    unique,
    pgEnum,
    boolean,
    index,
    jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { faculty, phd } from "./admin.ts";
import { phdSchemas } from "lib";
import { files } from "./form.ts";
export const phdEmailTemplates = pgTable("phd_email_templates", {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    description: text("description"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});
export const phdExamApplicationStatus = pgEnum(
    "phd_exam_application_status",
    phdSchemas.phdExamApplicationStatuses
);
export const phdProposalStatus = pgEnum(
    "phd_proposal_status",
    phdSchemas.phdProposalStatuses
);
export const phdExamResultStatus = pgEnum("phd_exam_result_status", [
    "pass",
    "fail",
]);
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
export const phdProposalSemesters = pgTable("phd_proposal_semesters", {
    id: serial("id").primaryKey(),
    semesterId: integer("semester_id")
        .notNull()
        .references(() => phdSemesters.id, { onDelete: "cascade" }),
    studentSubmissionDate: timestamp("student_submission_date", {
        withTimezone: true,
    }).notNull(),
    facultyReviewDate: timestamp("faculty_review_date", {
        withTimezone: true,
    }).notNull(),
    drcReviewDate: timestamp("drc_review_date", {
        withTimezone: true,
    }).notNull(),
    dacReviewDate: timestamp("dac_review_date", {
        withTimezone: true,
    }).notNull(),
});
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
        examinerCount: integer("examiner_count").notNull().default(2),
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
    qualifyingArea1: text("qualifying_area_1").notNull(),
    qualifyingArea2: text("qualifying_area_2").notNull(),
    applicationFormFileId: integer("application_form_file_id").references(
        () => files.id,
        { onDelete: "set null" }
    ),
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
    result: phdExamResultStatus("result"),
    attemptNumber: integer("attempt_number").notNull().default(1),
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
export const phdExaminerSuggestions = pgTable(
    "phd_examiner_suggestions",
    {
        id: serial("id").primaryKey(),
        applicationId: integer("application_id")
            .notNull()
            .references(() => phdExamApplications.id, { onDelete: "cascade" }),
        qualifyingArea: text("qualifying_area")
            .notNull()
            .references(() => phdSubAreas.subArea, { onDelete: "cascade" }),
        suggestedExaminers: text("suggested_examiners")
            .array()
            .notNull()
            .default(sql`'{}'::text[]`),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [unique().on(table.applicationId, table.qualifyingArea)]
);
export const phdExaminerAssignments = pgTable(
    "phd_examiner_assignments",
    {
        id: serial("id").primaryKey(),
        applicationId: integer("application_id")
            .notNull()
            .references(() => phdExamApplications.id, { onDelete: "cascade" }),
        qualifyingArea: text("qualifying_area")
            .notNull()
            .references(() => phdSubAreas.subArea, { onDelete: "cascade" }),
        examinerEmail: text("examiner_email")
            .notNull()
            .references(() => faculty.email, { onDelete: "cascade" }),
        notifiedAt: timestamp("notified_at", { withTimezone: true }),
        hasAccepted: boolean("has_accepted"),
        qpSubmitted: boolean("qp_submitted").default(false).notNull(),
    },
    (table) => [unique().on(table.applicationId, table.qualifyingArea)]
);
export const phdProposals = pgTable(
    "phd_proposals",
    {
        id: serial("id").primaryKey(),
        proposalSemesterId: integer("proposal_semester_id")
            .notNull()
            .references(() => phdProposalSemesters.id, { onDelete: "cascade" }),
        studentEmail: text("student_email")
            .notNull()
            .references(() => phd.email, { onDelete: "cascade" }),
        supervisorEmail: text("supervisor_email")
            .notNull()
            .references(() => faculty.email, { onDelete: "cascade" }),
        title: text("title").notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
        status: phdProposalStatus("status")
            .notNull()
            .default("supervisor_review"),
        comments: text("comments"),
        seminarDate: timestamp("seminar_date", { withTimezone: true }),
        seminarTime: text("seminar_time"),
        seminarVenue: text("seminar_venue"),
        hasOutsideCoSupervisor: boolean("has_outside_co_supervisor")
            .default(false)
            .notNull(),
        declaration: boolean("declaration").default(true).notNull(),
        appendixFileId: integer("appendix_file_id")
            .notNull()
            .references(() => files.id, { onDelete: "cascade" }),
        summaryFileId: integer("summary_file_id")
            .notNull()
            .references(() => files.id, { onDelete: "cascade" }),
        outlineFileId: integer("outline_file_id")
            .notNull()
            .references(() => files.id, { onDelete: "cascade" }),
        placeOfResearchFileId: integer("place_of_research_file_id").references(
            () => files.id,
            { onDelete: "cascade" }
        ),
        outsideCoSupervisorFormatFileId: integer(
            "outside_co_supervisor_format_file_id"
        ).references(() => files.id, { onDelete: "cascade" }),
        outsideSupervisorBiodataFileId: integer(
            "outside_supervisor_biodata_file_id"
        ).references(() => files.id, { onDelete: "cascade" }),
        active: boolean("active").generatedAlwaysAs(
            sql.raw(
                `CASE WHEN status IN(` +
                    phdSchemas.inactivePhdProposalStatuses
                        .map((s) => `'${s}'`)
                        .join(", ") +
                    `)THEN NULL ELSE true END`
            )
        ),
    },
    (table) => [
        index().on(table.studentEmail),
        index().on(table.supervisorEmail),
        unique().on(table.studentEmail, table.active),
    ]
);
export const phdProposalCoSupervisors = pgTable(
    "phd_proposal_co_supervisors",
    {
        id: serial("id").primaryKey(),
        proposalId: integer("proposal_id")
            .notNull()
            .references(() => phdProposals.id, { onDelete: "cascade" }),
        coSupervisorEmail: text("co_supervisor_email").notNull(),
        coSupervisorName: text("co_supervisor_name"),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
        approvalStatus: boolean("approval_status"),
    },
    (table) => [
        unique().on(table.proposalId, table.coSupervisorEmail),
        index().on(table.proposalId),
    ]
);
export const phdProposalDacMembers = pgTable(
    "phd_proposal_dac_members",
    {
        id: serial("id").primaryKey(),
        proposalId: integer("proposal_id")
            .notNull()
            .references(() => phdProposals.id, { onDelete: "cascade" }),
        dacMemberEmail: text("dac_member_email").notNull(),
        dacMemberName: text("dac_member_name"),
    },
    (table) => [
        unique().on(table.proposalId, table.dacMemberEmail),
        index().on(table.proposalId),
    ]
);
export const phdProposalDacReviews = pgTable(
    "phd_proposal_dac_reviews",
    {
        id: serial("id").primaryKey(),
        proposalId: integer("proposal_id")
            .notNull()
            .references(() => phdProposals.id, { onDelete: "cascade" }),
        dacMemberEmail: text("dac_member_email")
            .notNull()
            .references(() => faculty.email, { onDelete: "cascade" }),
        approved: boolean("approved").notNull(),
        comments: text("comments").notNull(),
        feedbackFileId: integer("feedback_file_id").references(() => files.id, {
            onDelete: "set null",
        }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [unique().on(table.proposalId, table.dacMemberEmail)]
);
export const phdProposalDacReviewForms = pgTable(
    "phd_proposal_dac_review_forms",
    {
        id: serial("id").primaryKey(),
        reviewId: integer("review_id")
            .notNull()
            .unique()
            .references(() => phdProposalDacReviews.id, {
                onDelete: "cascade",
            }),
        formData: jsonb("form_data").notNull(),
    }
);
export const phdExamTimetableSlots = pgTable(
    "phd_exam_timetable_slots",
    {
        id: serial("id").primaryKey(),
        examId: integer("exam_id")
            .notNull()
            .references(() => phdQualifyingExams.id, { onDelete: "cascade" }),
        studentEmail: text("student_email")
            .notNull()
            .references(() => phd.email, { onDelete: "cascade" }),
        qualifyingArea: text("qualifying_area").notNull(),
        examinerEmail: text("examiner_email").notNull(),
        slotNumber: integer("slot_number").notNull().default(0),
    },
    (table) => [
        unique().on(table.examId, table.studentEmail, table.qualifyingArea),
        index().on(table.examId),
    ]
);
