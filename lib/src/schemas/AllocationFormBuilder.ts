import { z } from "zod";

export const allocationFormTemplateFieldTypeEnum = z.enum([
  "TEXT", 
  "EMAIL", 
  "NUMBER", 
  "DATE", 
  "TEXTAREA",
  "CHECKBOX", 
  "RADIO", 
  "DROPDOWN", 
  "RATING", 
  "PREFERENCE"
]);

export const allocationFormTemplateFieldOptionSchema = z.object({
  id: z.string().uuid().optional(),
  templateFieldId: z.string().uuid().optional(), 
  label: z.string(),
  value: z.string(),
  order: z.number().int().optional(),
});


export const allocationFormTemplateFieldSchema = z.object({
  id: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(), 
  label: z.string(),
  isRequired: z.boolean().optional(),
  order: z.number().int().optional(),
  preferenceCount: z.number().int().optional(),
  type: allocationFormTemplateFieldTypeEnum,
  options: z.array(allocationFormTemplateFieldOptionSchema).optional(),
});


export const allocationFormTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  description: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().uuid().optional(),
  fields: z.array(allocationFormTemplateFieldSchema).optional(),
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

export const allocationFormResponseSchema = z.object({
  id: z.string().uuid().optional(),
  formId: z.string().uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const allocationFormResponseValueSchema = z.object({
  id: z.string().uuid().optional(),
  responseId: z.string().uuid(),
  templateFieldId: z.string().uuid(),
});


export const allocationFormResponseAnswerSchema = z.object({
  id: z.string().uuid().optional(),
  responseValueId: z.string().uuid(),
  optionId: z.string().uuid().optional(),
  textValue: z.string().optional(),
  numberValue: z.number().int().optional(),
  dateValue: z.date().optional(),
  courseCode: z.string().optional(),
  preference: z.number().int().optional(),
});
