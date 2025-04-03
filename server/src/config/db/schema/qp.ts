import {
    pgTable,
    serial,
    integer,
    text,
    timestamp,
    boolean,
    pgEnum,
} from "drizzle-orm/pg-core";
import { fileFields } from "./form.ts";
import { users } from "./admin.ts";
import { jsonb } from "drizzle-orm/pg-core";

export const qpStatusEnum = pgEnum("qp_status_enum", [
    "pending",
    "approved",
    "rejected",
]);

export const qpReviewRequests = pgTable("qp_review_requests", {
    id: serial("id").primaryKey(),
    dcaMemberEmail: text("dca_member_email")
    .notNull()
    .references(() => users.email, { onDelete: "cascade" }), 
    ficEmail: text("fic_email").references(() => users.email, {
        onDelete: "cascade",
    }),
    faculty1Email: text("faculty_1_email").references(() => users.email, {
        onDelete: "cascade",
    }),
    faculty2Email: text("faculty_2_email").references(() => users.email, {
        onDelete: "cascade",
    }),
    courseName: text("course_name").notNull(),
    courseCode: text("course_code").notNull(),
    ficDeadline: timestamp("fic_deadline", { withTimezone: true }),
    reviewDeadline: timestamp("review_deadline", { withTimezone: true }),
    midSemFileId: integer("mid_sem_file_id").references(() => fileFields.id, {
        onDelete: "set null",
    }),
    midSemSolFileId: integer("mid_sem_sol_file_id").references(
        () => fileFields.id,
        {
            onDelete: "set null",
        }
    ),
    compreFileId: integer("compre_file_id").references(() => fileFields.id, {
        onDelete: "set null",
    }),
    compreSolFileId: integer("compre_sol_file_id").references(
        () => fileFields.id,
        {
            onDelete: "set null",
        }
    ),
    review1: jsonb("review_1"), 
    review2: jsonb("review_2"),
    reviewed: text("reviewed").notNull().default("review pending"), 
    documentsUploaded: boolean("documents_uploaded").notNull().default(false),
    status: qpStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});
