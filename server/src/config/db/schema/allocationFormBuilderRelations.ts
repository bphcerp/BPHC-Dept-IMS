import { relations } from "drizzle-orm";
import { 
  allocationFormTemplate, 
  allocationForm, 
  allocationFormResponse, 
  allocationFormTemplateField, 
  allocationFormTemplateFieldOption, 
  allocationFormResponseValue, 
  allocationFormResponseAnswer 
} from "./allocationFormBuilder.ts";

import { users } from "./admin.ts";


export const allocationFormTemplateRelations = relations(
  allocationFormTemplate,
  ({ many }) => ({
    fields: many(allocationFormTemplateField),
    forms: many(allocationForm),
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
      fields: [allocationForm.createdBy],
      references: [users.email]
    })
    
  })
);

export const allocationFormResponseRelations = relations(
  allocationFormResponse,
  ({ one, many }) => ({
    form: one(allocationForm, {
      fields: [allocationFormResponse.formId],
      references: [allocationForm.id],
    }),
    values: many(allocationFormResponseValue),
    submittedBy: one(users, {
      fields: [allocationFormResponse.submittedBy],
      references: [users.email]
    })
  })
);

export const allocationFormTemplateFieldRelations = relations(
  allocationFormTemplateField,
  ({ one, many }) => ({
    template: one(allocationFormTemplate, {
      fields: [allocationFormTemplateField.templateId],
      references: [allocationFormTemplate.id],
    }),
    options: many(allocationFormTemplateFieldOption),
    responseValues: many(allocationFormResponseValue),
  })
);


export const allocationFormTemplateFieldOptionRelations = relations(
  allocationFormTemplateFieldOption,
  ({ one }) => ({
    field: one(allocationFormTemplateField, {
      fields: [allocationFormTemplateFieldOption.templateFieldId],
      references: [allocationFormTemplateField.id],
    }),
  })
);


export const allocationFormResponseValueRelations = relations(
  allocationFormResponseValue,
  ({ one, many }) => ({
    response: one(allocationFormResponse, {
      fields: [allocationFormResponseValue.responseId],
      references: [allocationFormResponse.id],
    }),
    field: one(allocationFormTemplateField, {
      fields: [allocationFormResponseValue.templateFieldId],
      references: [allocationFormTemplateField.id],
    }),
    answers: many(allocationFormResponseAnswer),
  })
);


export const allocationFormResponseAnswerRelations = relations(
  allocationFormResponseAnswer,
  ({ one }) => ({
    responseValue: one(allocationFormResponseValue, {
      fields: [allocationFormResponseAnswer.responseValueId],
      references: [allocationFormResponseValue.id],
    }),
    option: one(allocationFormTemplateFieldOption, {
      fields: [allocationFormResponseAnswer.optionId],
      references: [allocationFormTemplateFieldOption.id],
    }),
  })
);
