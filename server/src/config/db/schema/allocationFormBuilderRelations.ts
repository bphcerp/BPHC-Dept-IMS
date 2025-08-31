import { relations } from "drizzle-orm";
import { 
  formTemplate, 
  allocationForm, 
  formResponse, 
  formTemplateField, 
  formTemplateFieldOption, 
  formResponseValue, 
  formResponseAnswer 
} from "./allocationFormBuilder.ts";


export const formTemplateRelations = relations(formTemplate, ({ many }) => ({
  fields: many(formTemplateField),
  forms: many(allocationForm),
}));


export const allocationFormRelations = relations(allocationForm, ({ one, many }) => ({
  template: one(formTemplate, {
    fields: [allocationForm.templateId],
    references: [formTemplate.id],
  }),
  responses: many(formResponse),
}));


export const formResponseRelations = relations(formResponse, ({ one, many }) => ({
  form: one(allocationForm, {
    fields: [formResponse.formId],
    references: [allocationForm.id],
  }),
  values: many(formResponseValue),
}));


export const formTemplateFieldRelations = relations(formTemplateField, ({ one, many }) => ({
  template: one(formTemplate, {
    fields: [formTemplateField.templateId],
    references: [formTemplate.id],
  }),
  options: many(formTemplateFieldOption),
  responseValues: many(formResponseValue),
}));


export const formTemplateFieldOptionRelations = relations(formTemplateFieldOption, ({ one }) => ({
  field: one(formTemplateField, {
    fields: [formTemplateFieldOption.templateFieldId],
    references: [formTemplateField.id],
  }),
}));


export const formResponseValueRelations = relations(formResponseValue, ({ one, many }) => ({
  response: one(formResponse, {
    fields: [formResponseValue.responseId],
    references: [formResponse.id],
  }),
  field: one(formTemplateField, {
    fields: [formResponseValue.templateFieldId],
    references: [formTemplateField.id],
  }),
  answers: many(formResponseAnswer),
}));


export const formResponseAnswerRelations = relations(formResponseAnswer, ({ one }) => ({
  responseValue: one(formResponseValue, {
    fields: [formResponseAnswer.responseValueId],
    references: [formResponseValue.id],
  }),
  option: one(formTemplateFieldOption, {
    fields: [formResponseAnswer.optionId],
    references: [formTemplateFieldOption.id],
  }),
}));
