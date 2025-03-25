import { pgTable, serial, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { textFields, dateFields, fileFields, applications } from "./form.ts";

export const qpReviewRequests = pgTable("qp_review_requests", {
    id: serial("id").primaryKey(), // Request ID (primary key)
    applicationId: integer("application_id")
        .notNull()
        .references(() => applications.id, { onDelete: "cascade" }),
    dcaMember: integer("dca_member").references(() => textFields.id, {
        onDelete: "set null",
    }),
    courseNo: integer("course_no").references(() => textFields.id, {
        onDelete: "set null",
    }),
    courseName: integer("course_name").references(() => textFields.id, {
        onDelete: "set null",
    }),
    fic: integer("fic").references(() => textFields.id, {
        onDelete: "set null",
    }),
    ficDeadline: integer("fic_deadline").references(() => dateFields.id, {
        onDelete: "set null",
    }),
    midSem: integer("mid_sem").references(() => fileFields.id, {
        onDelete: "set null",
    }),
    midSemSol: integer("mid_sem_sol").references(() => fileFields.id, {
        onDelete: "set null",
    }),
    compre: integer("compre").references(() => fileFields.id, {
        onDelete: "set null",
    }),
    compreSol: integer("compre_sol").references(() => fileFields.id, {
        onDelete: "set null",
    }),
    documentsUploaded: boolean("documents_uploaded").notNull().default(false),
    faculty1: integer("faculty_1").references(() => textFields.id, {
        onDelete: "set null",
    }),
    faculty2: integer("faculty_2").references(() => textFields.id, {
        onDelete: "set null",
    }),
    review1: jsonb("review_1"), 
    review2: jsonb("review_2"), 
    reviewDeadline: integer("review_deadline").references(() => dateFields.id, {
        onDelete: "set null",
    }),
});