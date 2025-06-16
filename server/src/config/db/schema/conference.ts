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
} from "drizzle-orm/pg-core";
import { fileFields } from "./form.ts";
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

export const conferenceMemberReviews = pgTable(
    "conference_member_reviews",
    {
        applicationId: integer("application_id")
            .notNull()
            .references(() => conferenceApprovalApplications.id, {
                onDelete: "cascade",
            }),
        reviewerEmail: text("reviewer_email")
            .notNull()
            .references(() => users.email, { onDelete: "cascade" }),
        status: boolean("status").notNull(),
        comments: text("review"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        primaryKey({
            columns: [table.applicationId, table.reviewerEmail],
        }),
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
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        purpose: text("purpose"),
        contentTitle: text("content_title"),
        eventName: text("event_name"),
        venue: text("venue"),
        dateFrom: timestamp("date_from", { withTimezone: true }),
        dateTo: timestamp("date_to", { withTimezone: true }),
        organizedBy: text("organized_by"),
        modeOfEvent: text("mode_of_event"),
        description: text("description"),
        reimbursements: jsonb("reimbursements").notNull().default([]),
        fundingSplit: jsonb("funding_split").notNull().default([]),
        letterOfInvitation: integer("letter_of_invitation").references(
            () => fileFields.id,
            {
                onDelete: "set null",
            }
        ),
        firstPageOfPaper: integer("first_page_of_paper").references(
            () => fileFields.id,
            {
                onDelete: "set null",
            }
        ),
        reviewersComments: integer("reviewers_comments").references(
            () => fileFields.id,
            {
                onDelete: "set null",
            }
        ),
        detailsOfEvent: integer("details_of_event").references(
            () => fileFields.id,
            {
                onDelete: "set null",
            }
        ),
        otherDocuments: integer("other_documents").references(
            () => fileFields.id,
            {
                onDelete: "set null",
            }
        ),
    }
);
