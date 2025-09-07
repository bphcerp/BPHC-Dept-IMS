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

export const allocationFormTemplateFieldType = pgEnum(
    "allocation_form_template_field_type",
    [
        "TEXT",
        "EMAIL",
        "NUMBER",
        "DATE",
        "TEXTAREA",
        "CHECKBOX",
        "RADIO",
        "DROPDOWN",
        "PREFERENCE",
    ]
);

export const allocationFormTemplate = pgTable("allocation_form_template", {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
    name: text("name").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by"),
});

export const allocationForm = pgTable("allocation_form", {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
    templateId: uuid("template_id")
        .references(() => allocationFormTemplate.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by"),
    isPublished: boolean("is_published"),
});

export const allocationFormResponse = pgTable("allocation_form_response", {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
    formId: uuid("form_id")
        .references(() => allocationForm.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
    submittedBy: uuid("submitted_by"),
});

export const allocationFormTemplateField = pgTable(
    "allocation_form_template_field",
    {
        id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
        templateId: uuid("template_id")
            .references(() => allocationFormTemplate.id, { onDelete: "cascade" }),
        label: text("label").notNull(),
        isRequired: boolean("is_required"),
        order: integer("order"),
        preferenceCount: integer("preference_count"),
        type: allocationFormTemplateFieldType("type"),
    }
);

export const allocationFormTemplateFieldOption = pgTable(
    "allocation_form_template_field_option",
    {
        id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
        templateFieldId: uuid("template_field_id")
            .references(() => allocationFormTemplateField.id, {
                onDelete: "cascade",
            }),
        label: text("label").notNull(),
        value: text("value").notNull(),
        order: integer("order"),
    }
);

export const allocationFormResponseValue = pgTable(
    "allocation_form_response_value",
    {
        id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
        responseId: uuid("response_id")
            .references(() => allocationFormResponse.id, { onDelete: "cascade" }),
        templateFieldId: uuid("template_field_id")
            .references(() => allocationFormTemplateField.id, {
                onDelete: "cascade",
            }),
    }
);

export const allocationFormResponseAnswer = pgTable(
    "allocation_form_response_answer",
    {
        id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
        responseValueId: uuid("response_value_id")
            .references(() => allocationFormResponseValue.id, {
                onDelete: "cascade",
            }),
        optionId: uuid("option_id").references(
            () => allocationFormTemplateFieldOption.id
        ),
        textValue: text("text_value"),
        numberValue: integer("number_value"),
        dateValue: timestamp("date_value", { withTimezone: true }),
        courseCode: text("course_code"),
        preference: integer("preference"),
    }
);
