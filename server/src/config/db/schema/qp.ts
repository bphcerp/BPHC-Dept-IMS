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

export const requestTypeEnum = pgEnum("type_enum", qpSchemas.requestTypes);

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
    midSemQpFilePath: integer("midSem_qp_file_path").references(
        () => fileFields.id,
        {
            onDelete: "set null",
        }
    ),
    midSemSolFilePath: integer("midSem_sol_file_path").references(
        () => fileFields.id,
        {}
    ),
    compreQpFilePath: integer("compre_qp_file_path").references(
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
    documentsUploaded: boolean("documents_uploaded").notNull().default(false),
    status: qpStatusEnum("status").notNull().default("notsubmitted"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    category: categoryEnum("category").notNull(),
    submittedOn: timestamp("submitted_on", { withTimezone: true }),
    requestType: requestTypeEnum("request_type").notNull(),
});
