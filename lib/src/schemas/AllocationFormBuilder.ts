import { z } from "zod";

export const formTemplateFieldTypeEnum = z.enum([
  'TEXT', 'EMAIL', 'NUMBER', 'DATE', 'TEXTAREA', 
  'CHECKBOX', 'RADIO', 'DROPDOWN', 'RATING', 'PREFERENCE'
]);

export const formTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  description: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().uuid().optional(),
});

export const allocationFormSchema = z.object({
  id: z.string().uuid().optional(),
  templateId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().uuid().optional(),
  isPublished: z.boolean().optional(),
});

export const formResponseSchema = z.object({
  id: z.string().uuid().optional(),
  formId: z.string().uuid(),
  submittedAt: z.date().optional(),
  submittedBy: z.string().uuid().optional(),
});

export const formTemplateFieldSchema = z.object({
  id: z.string().uuid().optional(),
  templateId: z.string().uuid(),
  label: z.string(),
  isRequired: z.boolean().optional(),
  order: z.number().int().optional(),
  preferenceCount: z.number().int().optional(),
  type: formTemplateFieldTypeEnum,
});

export const formTemplateFieldOptionSchema = z.object({
  id: z.string().uuid().optional(),
  templateFieldId: z.string().uuid(),
  label: z.string(),
  value: z.string(),
  order: z.number().int().optional(),
});

export const formResponseValueSchema = z.object({
  id: z.string().uuid().optional(),
  responseId: z.string().uuid(),
  templateFieldId: z.string().uuid(),
});

export const formResponseAnswerSchema = z.object({
  id: z.string().uuid().optional(),
  responseValueId: z.string().uuid(),
  optionId: z.string().uuid().optional(),
  textValue: z.string().optional(),
  numberValue: z.number().int().optional(),
  dateValue: z.date().optional(),
  courseCode: z.string().optional(),
  preference: z.number().int().optional(),
});
