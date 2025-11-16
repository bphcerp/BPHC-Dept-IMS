import {
    pgTable,
    serial,
    text,
    integer,
    timestamp,
    pgEnum,
    boolean,
    unique,
} from "drizzle-orm/pg-core";
import { phd, faculty, users } from "./admin.ts";
import { phdSemesters } from "./phd.ts";
import { files } from "./form.ts";
import { phdRequestSchemas } from "lib";

export const phdRequestTypeEnum = pgEnum(
    "phd_request_type",
    phdRequestSchemas.phdRequestTypes
);
export const phdRequestStatusEnum = pgEnum(
    "phd_request_status",
    phdRequestSchemas.phdRequestStatuses
);
export const drcAssignmentStatusEnum = pgEnum("drc_assignment_status", [
    "pending",
    "approved",
    "reverted",
]);

export const phdRequests = pgTable("phd_requests", {
    id: serial("id").primaryKey(),
    studentEmail: text("student_email")
        .notNull()
        .references(() => phd.email, { onDelete: "cascade" }),
    supervisorEmail: text("supervisor_email")
        .notNull()
        .references(() => faculty.email, { onDelete: "cascade" }),
    semesterId: integer("semester_id")
        .notNull()
        .references(() => phdSemesters.id, { onDelete: "restrict" }),
    requestType: phdRequestTypeEnum("request_type").notNull(),
    status: phdRequestStatusEnum("status").notNull(),
    status_before_edit_request: phdRequestStatusEnum(
        "status_before_edit_request"
    ),
    comments: text("comments"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const phdRequestDocuments = pgTable("phd_request_documents", {
    id: serial("id").primaryKey(),
    requestId: integer("request_id")
        .notNull()
        .references(() => phdRequests.id, { onDelete: "cascade" }),
    fileId: integer("file_id")
        .notNull()
        .references(() => files.id, { onDelete: "cascade" }),
    uploadedByEmail: text("uploaded_by_email")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
    documentType: text("document_type").notNull(),
    isPrivate: boolean("is_private").default(false).notNull(),
});

export const phdRequestReviews = pgTable("phd_request_reviews", {
    id: serial("id").primaryKey(),
    requestId: integer("request_id")
        .notNull()
        .references(() => phdRequests.id, { onDelete: "cascade" }),
    reviewerEmail: text("reviewer_email")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
    reviewerRole: text("reviewer_role").notNull(),
    approved: boolean("approved").notNull(),
    comments: text("comments"),
    studentComments: text("student_comments"),
    supervisorComments: text("supervisor_comments"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    status_at_review: text("status_at_review"),
});

export const phdRequestDrcAssignments = pgTable(
    "phd_request_drc_assignments",
    {
        id: serial("id").primaryKey(),
        requestId: integer("request_id")
            .notNull()
            .references(() => phdRequests.id, { onDelete: "cascade" }),
        drcMemberEmail: text("drc_member_email")
            .notNull()
            .references(() => faculty.email, { onDelete: "cascade" }),
        status: drcAssignmentStatusEnum("status").default("pending").notNull(),
    },
    (table) => [unique().on(table.requestId, table.drcMemberEmail)]
);
