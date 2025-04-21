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
import { qpSchemas } from "lib";

export const qpStatusEnum = pgEnum(
    "qp_status_enum",
    qpSchemas.qpReviewStatuses
);

export const categoryEnum = pgEnum("category_enum", qpSchemas.categories);

export const qpReviewRequests = pgTable("qp_review_requests", {
    id: serial("id").primaryKey(),
    icEmail: text("ic_email").references(() => users.email, {
        onDelete: "cascade",
    }),
    reviewerEmail: text("reviewer_email").references(() => users.email, {
        onDelete: "cascade",
    }),
    courseName: text("course_name").notNull(),
    courseCode: text("course_code").notNull(),
    previousSubmissionId: integer("previous_submission_id"),
    midSemFilePath: integer("mid_sem_file_path").references(
        () => fileFields.id,
        {
            onDelete: "set null",
        }
    ),
    midSemSolFilePath: integer("mid_sem_sol_file_path").references(
        () => fileFields.id,
        {
            onDelete: "set null",
        }
    ),
    compreFilePath: integer("compre_file_path").references(
        () => fileFields.id,
        {
            onDelete: "set null",
        }
    ),
    compreSolFilePath: integer("compre_sol_file_path").references(
        () => fileFields.id,
        {
            onDelete: "set null",
        }
    ),
    review: jsonb("review"),
    ficDeadline: timestamp("fic_deadline", { withTimezone: true }),
    reviewDeadline: timestamp("review_deadline", { withTimezone: true }),
    documentsUploaded: boolean("documents_uploaded").notNull().default(false),
    status: qpStatusEnum("status").notNull().default("notsubmitted"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    category: categoryEnum("category").notNull(),
});
