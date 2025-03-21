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
import { handoutSchemas } from "lib";

export const handoutStatusEnum = pgEnum(
    "handout_status_enum",
    handoutSchemas.handoutStatuses
);

export const courseHandoutRequests = pgTable("course_handout_requests", {
    id: serial("id").primaryKey(),
    icEmail: text("ic_email")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
    reviewerEmail: text("reviewer_email").references(() => users.email, {
        onDelete: "cascade",
    }),
    courseName: text("course_name").notNull(),
    courseCode: text("course_code").notNull(),
    scopeAndObjective: boolean("scope_and_objective"),
    textBookPrescribed: boolean("text_book_prescribed"),
    lecturewisePlanLearningObjective: boolean(
        "lecturewise_plan_learning_objective"
    ),
    lecturewisePlanCourseTopics: boolean("lecturewise_plan_course_topics"),
    numberOfLP: boolean("number_of_lp"),
    evaluationScheme: boolean("evaluation_scheme"),
    status: handoutStatusEnum("status").notNull().default("notsubmitted"),
    handoutFilePath: integer("handout_file_path").references(
        () => fileFields.id,
        {
            onDelete: "set null",
        }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});
