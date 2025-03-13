import {
    pgTable,
    serial,
    integer,
    boolean,
    timestamp,
    jsonb,
    text,
} from "drizzle-orm/pg-core";
import { textFields, dateFields } from "./form.ts";

export const qpRequests = pgTable("qp_requests", {
    id: serial("id").primaryKey(),
    requestId: integer("request_id")
        .notNull()
        .references(() => textFields.id, { onDelete: "cascade" }),
    dca: integer("dca")
        .notNull()
        .references(() => textFields.id, { onDelete: "set null" }),
    courseNo: integer("course_no")
        .notNull()
        .references(() => textFields.id, { onDelete: "set null" }),
    course: integer("course")
        .notNull()
        .references(() => textFields.id, { onDelete: "set null" }),
    fic: integer("fic")
        .notNull()
        .references(() => textFields.id, { onDelete: "set null" }),
    ficDeadline: integer("fic_deadline")
        .notNull()
        .references(() => dateFields.id, { onDelete: "set null" }),
    midSem: text("midsem"),
    midSemSol: text("midsem_sol"),
    compre: text("compre"),
    compreSol: text("compre_sol"),
    documentsUploaded: boolean("documents_uploaded").notNull(),
    faculty1: integer("faculty_1")
        .notNull()
        .references(() => textFields.id, { onDelete: "set null" }),
    review1: jsonb("review_1").notNull(),
    faculty2: integer("faculty_2")
        .notNull()
        .references(() => textFields.id, { onDelete: "set null" }),
    review2: jsonb("review_2").notNull(),
    approvalStatus: boolean("approval_status").notNull(),
    reviewDeadline: integer("review_deadline")
        .notNull()
        .references(() => dateFields.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
