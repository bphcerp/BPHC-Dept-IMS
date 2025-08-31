import {
    pgTable,
    integer,
    text,
    boolean,
    timestamp,
    pgEnum,
    uuid
} from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";

export const formTemplateFieldType = pgEnum(
    "formTemplateFieldType",
    ['TEXT', 'EMAIL', 'NUMBER', 'DATE', 'TEXTAREA', 'CHECKBOX', 'RADIO', 'DROPDOWN', 'RATING', 'PREFERENCE']
);


export const formTemplate = pgTable("form_template", {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
    name: text("name").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by"),
});


export const allocationForm = pgTable("form", {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
    templateId: uuid("template_id")
        .references(() => formTemplate.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by"),
    isPublished: boolean("is_published"),
});


export const formResponse = pgTable("form_response", {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
    formId: uuid("form_id")
        .references(() => allocationForm.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
    submittedBy: uuid("submitted_by"),
});


export const formTemplateField = pgTable("form_template_field", {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
    templateId: uuid("template_id")
        .references(() => formTemplate.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    isRequired: boolean("is_required"),
    order: integer("order"),
    preferenceCount: integer("preference_count"),
    type: formTemplateFieldType("form_template_field_type"),
});


export const formTemplateFieldOption = pgTable("form_template_field_option", {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
    templateFieldId: uuid("template_field_id")
        .references(() => formTemplateField.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    value: text("value").notNull(),
    order: integer("order"),
});

export const formResponseValue = pgTable("form_response_value", {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
    responseId: uuid("response_id")
        .references(() => formResponse.id, { onDelete: "cascade" }),
    templateFieldId: uuid("template_field_id")
        .references(() => formTemplateField.id, { onDelete: "cascade" }),
});


export const formResponseAnswer = pgTable("form_response_answer", {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
    responseValueId: uuid("response_value_id")
        .references(() => formResponseValue.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
        .references(() => formTemplateFieldOption.id),
    textValue: text("text_value"),
    numberValue: integer("number_value"),
    dateValue: timestamp("date_value", { withTimezone: true }),
    courseCode: text("course_code"),
    preference: integer("preference"),
});
