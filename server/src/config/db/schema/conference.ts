import {
    pgTable,
    serial,
    integer,
    pgEnum,
    text,
    timestamp,
    primaryKey,
    boolean,
    jsonb,
    index,
} from "drizzle-orm/pg-core";
import { files } from "./form.ts";
import { conferenceSchemas } from "lib";
import { users } from "./admin.ts";

export const conferenceStateEnum = pgEnum(
    "conference_state_enum",
    conferenceSchemas.states
);

export const conferenceGlobal = pgTable("conference_global", {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
});

export const conferenceApplicationMembers = pgTable(
    "conference_application_members",
    {
        applicationId: integer("application_id")
            .notNull()
            .references(() => conferenceApprovalApplications.id, {
                onDelete: "cascade",
            }),
        memberEmail: text("member_email")
            .notNull()
            .references(() => users.email, { onDelete: "cascade" }),
        reviewStatus: boolean("review_status"),
        comments: text("comments"),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    (table) => [
        primaryKey({
            columns: [table.applicationId, table.memberEmail],
        }),
        index("conference_app_members_status_idx").on(table.reviewStatus),
        index("conference_app_members_email_idx").on(table.memberEmail),
    ]
);

export const conferenceStatusLog = pgTable(
    "conference_status_log",
    {
        applicationId: integer("application_id")
            .notNull()
            .references(() => conferenceApprovalApplications.id, {
                onDelete: "cascade",
            }),
        userEmail: text("user_email")
            .notNull()
            .references(() => users.email, { onDelete: "cascade" }),
        action: text("action").notNull(),
        timestamp: timestamp("timestamp", { withTimezone: true })
            .notNull()
            .defaultNow(),
        comments: text("comments"),
    },
    (table) => [
        primaryKey({
            columns: [
                table.applicationId,
                table.userEmail,
                table.action,
                table.timestamp,
            ],
        }),
    ]
);

export const conferenceApprovalApplications = pgTable(
    "conference_approval_applications",
    {
        id: serial("id").primaryKey(),
        userEmail: text("user_email")
            .notNull()
            .references(() => users.email, { onDelete: "cascade" }),
        state: conferenceStateEnum("state")
            .notNull()
            .default(conferenceSchemas.states[1]),
        approvalFormFileId: integer("approval_form_file_id").references(
            () => files.id,
            { onDelete: "set null" }
        ),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        purpose: text("purpose").notNull(),
        contentTitle: text("content_title").notNull(),
        eventName: text("event_name").notNull(),
        venue: text("venue").notNull(),
        dateFrom: timestamp("date_from", { withTimezone: true }).notNull(),
        dateTo: timestamp("date_to", { withTimezone: true }).notNull(),
        organizedBy: text("organized_by").notNull(),
        modeOfEvent: text("mode_of_event").notNull(),
        description: text("description").notNull(),
        reimbursements: jsonb("reimbursements").notNull().default([]),
        fundingSplit: jsonb("funding_split").notNull().default([]),
        letterOfInvitationFileId: integer(
            "letter_of_invitation_file_id"
        ).references(() => files.id, { onDelete: "set null" }),
        firstPageOfPaperFileId: integer(
            "first_page_of_paper_file_id"
        ).references(() => files.id, { onDelete: "set null" }),
        reviewersCommentsFileId: integer(
            "reviewers_comments_file_id"
        ).references(() => files.id, { onDelete: "set null" }),
        detailsOfEventFileId: integer("details_of_event_file_id").references(
            () => files.id,
            { onDelete: "set null" }
        ),
        otherDocumentsFileId: integer("other_documents_file_id").references(
            () => files.id,
            { onDelete: "set null" }
        ),
        // Flags set by applicant to request convener action
        requestEdit: boolean("request_edit").notNull().default(false),
        requestDelete: boolean("request_delete").notNull().default(false),
    }
);
