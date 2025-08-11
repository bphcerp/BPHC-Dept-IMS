import {
    pgTable,
    serial,
    integer,
    text,
    timestamp,
    boolean,
    pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./admin.ts";
import { handoutSchemas } from "lib";
import { files } from "./form.ts";

export const handoutStatusEnum = pgEnum(
    "handout_status_enum",
    handoutSchemas.handoutStatuses
);

export const categoryEnum = pgEnum("category_enum", handoutSchemas.categories);

export const courseHandoutRequests = pgTable("course_handout_requests", {
    id: serial("id").primaryKey(),
    icEmail: text("ic_email").references(() => users.email, {
        onDelete: "cascade",
    }),
    reviewerEmail: text("reviewer_email").references(() => users.email, {
        onDelete: "cascade",
    }),
    previousSubmissionId: integer("previous_submission_id"),
    courseName: text("course_name").notNull(),
    courseCode: text("course_code").notNull(),
    scopeAndObjective: boolean("scope_and_objective"),
    textBookPrescribed: boolean("text_book_prescribed"),
    lecturewisePlanLearningObjective: boolean(
        "lecturewise_plan_learning_objective"
    ),
    lecturewisePlanCourseTopics: boolean("lecturewise_plan_course_topics"),
    ncCriteria: boolean("nc_criteria"),
    numberOfLP: boolean("number_of_lp"),
    evaluationScheme: boolean("evaluation_scheme"),
    status: handoutStatusEnum("status").notNull().default("notsubmitted"),
    handoutFilePath: integer("handout_file_path").references(() => files.id, {
        onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    submittedOn: timestamp("submitted_on", { withTimezone: true }),
    openBook: integer("open_book"),
    midSem: integer("midsem"),
    compre: integer("compre"),
    otherEvals: integer("other_evals"),
    deadline: timestamp("deadline", { withTimezone: true }),
    comments: text("comments"),
    category: categoryEnum("category").notNull(),
});
