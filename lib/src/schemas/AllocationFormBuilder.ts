import { z } from "zod";

export const allocationFormTemplateFieldTypeEnum = z.enum([
    "PREFERENCE",
    "TEACHING_ALLOCATION",
]);

export const allocationFormTemplatePreferenceTypeEnum = z.enum([
    "LECTURE",
    "TUTORIAL",
    "PRACTICAL",
]);

export const allocationFormResponsesClientSchema = z.object({
    teachingAllocation: z.number().int().optional(),
    templateFieldId: z.string().uuid().optional(),
    courseCode: z.string().optional(),
    preference: z.number().int().optional(),
})

export const allocationFormResponseSchema = z.object({
    formId: z.string().uuid(),
    response: z.array(allocationFormResponsesClientSchema),
});

export const allocationFormTemplateFieldSchema = z.object({
    // id: z.string().uuid().optional(),
    templateId: z.string().uuid().optional(),
    label: z.string(),
    isRequired: z.boolean().optional(),
    order: z.number().int().optional(),
    preferenceCount: z.number().int().optional(),
    preferenceType: allocationFormTemplatePreferenceTypeEnum.optional(),
    type: allocationFormTemplateFieldTypeEnum,
});

export const updateAllocationFormTemplateFieldSchema =
    allocationFormTemplateFieldSchema.partial().extend({
        id: z.string().uuid(),
    });

export const deleteAllocationFormTemplateFieldSchema = z.object({
    id: z.string().uuid(),
});

export const allocationFormTemplateSchema = z.object({
    // id: z.string().uuid().optional(),
    name: z.string(),
    description: z.string(),
    // createdAt: z.date().optional(),
    // updatedAt: z.date().optional(),
    fields: z.array(allocationFormTemplateFieldSchema).optional(),
});

export const updateAllocationFormTemplateSchema = allocationFormTemplateSchema
    .partial()
    .extend({
        id: z.string().uuid(),
    });

export const deleteAllocationFormTemplateSchema = z.object({
    id: z.string().uuid(),
});

export const allocationFormSchema = z.object({
    // id: z.string().uuid().optional(),
    templateId: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    // createdAt: z.date().optional(),
    // updatedAt: z.date().optional(),
    isPublished: z.boolean().optional(),
});

export const updateAllocationFormSchema = allocationFormSchema
    .partial()
    .extend({
        id: z.string().uuid(),
    });

export const deleteAllocationFormSchema = z.object({
    id: z.string().uuid(),
});

export const updateAllocationFormResponseSchema = allocationFormResponseSchema
    .partial()
    .extend({
        id: z.string().uuid(),
    });

export const deleteAllocationFormResponseSchema = z.object({
    id: z.string().uuid(),
});
