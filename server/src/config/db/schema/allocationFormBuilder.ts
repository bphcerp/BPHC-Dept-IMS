import {
    pgTable,
    integer,
    text,
    boolean,
    timestamp,
    pgEnum,
    uuid,
} from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";
import { roles, users } from "./admin.ts";
import { course } from "./allocation.ts";
import { allocationCourseGroup } from "./allocation.ts";
import { sectionTypes } from "node_modules/lib/src/schemas/Allocation.ts";

export const allocationFormTemplateFieldType = pgEnum(
    "allocation_form_template_field_type",
    ["PREFERENCE", "TEACHING_ALLOCATION"]
);

export const allocationFormTemplatePreferenceFieldType = pgEnum(
    "allocation_form_template_preference_field_type",
    sectionTypes
);

export const allocationFormTemplate = pgTable("allocation_form_template", {
    id: uuid("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),
    name: text("name").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdByEmail: text("created_by")
        .notNull()
        .references(() => users.email),
});

export const allocationForm = pgTable("allocation_form", {
    id: uuid("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),
    templateId: uuid("template_id").references(
        () => allocationFormTemplate.id,
        { onDelete: "cascade" }
    ).notNull(),
    title: text("title").notNull().unique(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdByEmail: text("created_by")
        .notNull()
        .references(() => users.email),
    publishedDate: timestamp("published_date", { withTimezone: true }),
    allocationDeadline: timestamp("allocation_deadline", { withTimezone: true }),
    emailMsgId: text('email_msg_id')
});

export const allocationFormResponse = pgTable("allocation_form_response", {
    id: uuid("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),
    formId: uuid("form_id").references(() => allocationForm.id, {
        onDelete: "cascade",
    }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
    submittedByEmail: text("submitted_by")
        .notNull()
        .references(() => users.email),
    templateFieldId: uuid("template_field_id").references(
        () => allocationFormTemplateField.id,
        {
            onDelete: "cascade",
        }
    ),
    teachingAllocation: integer("teaching_allocation"),
    courseCode: text("course_code").references(() => course.code),
    preference: integer("preference"),
    takenConsecutively: boolean("taken_consecutively"),
});

export const allocationFormTemplateField = pgTable(
    "allocation_form_template_field",
    {
        id: uuid("id")
            .primaryKey()
            .$defaultFn(() => uuidv4()),
        templateId: uuid("template_id").references(
            () => allocationFormTemplate.id,
            { onDelete: "cascade" }
        ),
        label: text("label").notNull(),
        preferenceCount: integer("preference_count"),
        preferenceType:
            allocationFormTemplatePreferenceFieldType("preference_type"),
        type: allocationFormTemplateFieldType("type"),
        groupId: uuid("group_id").references(() => allocationCourseGroup.id, {
            onDelete: "set null",
        }),
        viewableByRoleId: integer("viewable_by_role_id").references(() => roles.id, {
            onDelete: "set null",
        })
    }
);
