import { relations } from "drizzle-orm";
import {
    allocationFormTemplate,
    allocationForm,
    allocationFormResponse,
    allocationFormTemplateField,
} from "./allocationFormBuilder.ts";

import { users } from "./admin.ts";
import { course, semester } from "./allocation.ts";

export const allocationFormTemplateRelations = relations(
    allocationFormTemplate,
    ({ one, many }) => ({
        fields: many(allocationFormTemplateField),
        forms: many(allocationForm),
        createdBy: one(users, {
            fields: [allocationFormTemplate.createdByEmail],
            references: [users.email],
        }),
    })
);

export const allocationFormRelations = relations(
    allocationForm,
    ({ one, many }) => ({
        template: one(allocationFormTemplate, {
            fields: [allocationForm.templateId],
            references: [allocationFormTemplate.id],
        }),
        responses: many(allocationFormResponse),
        createdBy: one(users, {
            fields: [allocationForm.createdByEmail],
            references: [users.email],
        }),
        semester: one(semester, {
            fields: [allocationForm.id],
            references: [semester.formId],
        }),
    })
);

export const allocationFormResponseRelations = relations(
    allocationFormResponse,
    ({ one }) => ({
        form: one(allocationForm, {
            fields: [allocationFormResponse.formId],
            references: [allocationForm.id],
        }),
        submittedBy: one(users, {
            fields: [allocationFormResponse.submittedByEmail],
            references: [users.email],
        }),
        course: one(course, {
            fields: [allocationFormResponse.courseCode],
            references: [course.code],
        }),
        templateField: one(allocationFormTemplateField, {
            fields: [allocationFormResponse.templateFieldId],
            references: [allocationFormTemplateField.id],
        }),
    })
);

export const allocationFormTemplateFieldRelations = relations(
    allocationFormTemplateField,
    ({ one }) => ({
        template: one(allocationFormTemplate, {
            fields: [allocationFormTemplateField.templateId],
            references: [allocationFormTemplate.id],
        }),
    })
);
