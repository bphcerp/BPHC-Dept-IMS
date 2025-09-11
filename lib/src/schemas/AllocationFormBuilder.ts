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
  "PREFERENCE"
]);
export const allocationFormSubmittedAnswerSchema = z.object({
  templateFieldId: z.string().uuid(),
  value: z.object({
    optionIds: z.array(z.string().uuid()).optional(),  
    textValue: z.string().optional(),
    numberValue: z.number().int().optional(),
    dateValue: z.union([z.date(), z.string().datetime()]).optional(),
    courseCode: z.string().optional(),
    preference: z.number().int().optional(),
  }),
});

export const allocationFormResponseSchema = z.object({
  formId: z.string().uuid(),
  answers: z.array(allocationFormSubmittedAnswerSchema),
});

export const allocationFormTemplateFieldOptionSchema = z.object({
  // id: z.string().uuid().optional(),
  templateFieldId: z.string().uuid().optional(), 
  label: z.string(),
  value: z.string(),
  order: z.number().int().optional(),
});

export const updateAllocationFormTemplateFieldOptionSchema = allocationFormTemplateFieldOptionSchema.partial().extend({
  id: z.string().uuid()
});

export const deleteAllocationFormTemplateFieldOptionSchema = z.object({
  id: z.string().uuid()
});


export const allocationFormTemplateFieldSchema = z.object({
  // id: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(), 
  label: z.string(),
  isRequired: z.boolean().optional(),
  order: z.number().int().optional(),
  preferenceCount: z.number().int().optional(),
  type: allocationFormTemplateFieldTypeEnum,
  options: z.array(allocationFormTemplateFieldOptionSchema).optional(),
});

export const updateAllocationFormTemplateFieldSchema = allocationFormTemplateFieldSchema.partial().extend({
  id: z.string().uuid()
});

export const deleteAllocationFormTemplateFieldSchema = z.object({
  id: z.string().uuid()
});


export const allocationFormTemplateSchema = z.object({
  // id: z.string().uuid().optional(),
  name: z.string(),
  description: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().uuid().optional(),
  fields: z.array(allocationFormTemplateFieldSchema).optional(),
});

export const updateAllocationFormTemplateSchema = allocationFormTemplateSchema.partial().extend({
  id: z.string().uuid()
});

export const deleteAllocationFormTemplateSchema = z.object({
  id: z.string().uuid()
});


export const allocationFormSchema = z.object({
  // id: z.string().uuid().optional(),
  templateId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().uuid().optional(),
  isPublished: z.boolean().optional(),
});

export const updateAllocationFormSchema = allocationFormSchema.partial().extend({
  id: z.string().uuid()
});

export const deleteAllocationFormSchema = z.object({
  id: z.string().uuid()
});



export const updateAllocationFormResponseSchema = allocationFormResponseSchema.partial().extend({
  id: z.string().uuid()
});

export const deleteAllocationFormResponseSchema = z.object({
  id: z.string().uuid()
});

export const allocationFormResponseValueSchema = z.object({
  // id: z.string().uuid().optional(),
  responseId: z.string().uuid(),
  templateFieldId: z.string().uuid(),
});

export const updateAllocationFormResponseValueSchema = allocationFormResponseValueSchema.partial().extend({
  id: z.string().uuid()
});

export const deleteAllocationFormResponseValueSchema = z.object({
  id: z.string().uuid()
});


export const allocationFormResponseAnswerSchema = z.object({
  // id: z.string().uuid().optional(),
  responseValueId: z.string().uuid(),
  optionId: z.string().uuid().optional(),
  textValue: z.string().optional(),
  numberValue: z.number().int().optional(),
  dateValue: z.date().optional(),
  courseCode: z.string().optional(),
  preference: z.number().int().optional(),
});

export const updateAllocationFormResponseAnswerSchema = allocationFormResponseAnswerSchema.partial().extend({
  id: z.string().uuid()
});

export const deleteAllocationFormResponseAnswerSchema = z.object({
  id: z.string().uuid()
});

