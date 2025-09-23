import { z } from "zod";
import {
    allocationFormTemplateFieldTypeEnum,
    allocationFormTemplateFieldSchema,
    allocationFormTemplateSchema,
    allocationFormSchema,
    deleteAllocationFormResponseSchema,
    deleteAllocationFormSchema,
    deleteAllocationFormTemplateFieldSchema,
    deleteAllocationFormTemplateSchema,
    updateAllocationFormResponseSchema,
    updateAllocationFormSchema,
    updateAllocationFormTemplateFieldSchema,
    updateAllocationFormTemplateSchema,
    allocationFormTemplatePreferenceTypeEnum,
    allocationFormResponseSchema,
    allocationFormResponsesClientSchema,
} from "../schemas/AllocationFormBuilder.ts";
import { MemberDetailsResponse } from "../schemas/Admin.ts";
import { Course } from "./allocation.ts";

export type NewAllocationFormTemplateField = z.infer<
    typeof allocationFormTemplateFieldSchema
>;
export type NewAllocationFormTemplate = z.infer<
    typeof allocationFormTemplateSchema
>;
export type NewAllocationForm = z.infer<typeof allocationFormSchema>;
export type NewAllocationFormClientResponse = z.infer<
    typeof allocationFormResponsesClientSchema
>;
export type NewAllocationFormResponse = z.infer<
    typeof allocationFormResponseSchema
>;

export type UpdateAllocationFormTemplateField = z.infer<
    typeof updateAllocationFormTemplateFieldSchema
>;
export type UpdateAllocationFormTemplate = z.infer<
    typeof updateAllocationFormTemplateSchema
>;
export type UpdateAllocationForm = z.infer<typeof updateAllocationFormSchema>;
export type UpdateAllocationFormResponse = z.infer<
    typeof updateAllocationFormResponseSchema
>;

export type DeleteAllocationFormTemplateField = z.infer<
    typeof deleteAllocationFormTemplateFieldSchema
>;
export type DeleteAllocationFormTemplate = z.infer<
    typeof deleteAllocationFormTemplateSchema
>;
export type DeleteAllocationForm = z.infer<typeof deleteAllocationFormSchema>;
export type DeleteAllocationFormResponse = z.infer<
    typeof deleteAllocationFormResponseSchema
>;

export type AllocationFormTemplateFieldType = z.infer<
    typeof allocationFormTemplateFieldTypeEnum
>;
export type AllocationFormTemplatePreferenceFieldType = z.infer<
    typeof allocationFormTemplatePreferenceTypeEnum
>;

export type AllocationFormTemplateField = NewAllocationFormTemplateField & {
    id: string;
    template?: AllocationFormTemplate;
};

export type AllocationFormTemplate = Omit<
    NewAllocationFormTemplate,
    "fields"
> & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    fields: AllocationFormTemplateField[];
    createdBy: Pick<MemberDetailsResponse, "name" | "email">;
};

// Use this for the template/getAll endpoint
export type AllocationFormTemplateList = Omit<
    NewAllocationFormTemplate,
    "fields"
> & {
    id: string;
    createdBy: Pick<MemberDetailsResponse, "name" | "email">;
};

export type AllocationForm = NewAllocationForm & {
	id: string;
	template: AllocationFormTemplate;
	publishedDate: Date | null
	allocationDeadline: Date | null
	createdAt: Date;
	updatedAt: Date;
	createdBy: Pick<MemberDetailsResponse, 'name' | 'email'>
};

// Use this for the form/getAll endpoint
export type AllocationFormList = NewAllocationForm & {
    id: string;
    template: Pick<AllocationFormTemplate, "id" | "name">;
    createdBy: Pick<MemberDetailsResponse, "name" | "email">;
};

export type RawAllocationFormResponse = {
    formId: string;
    teachingAllocation?: number | null;
    templateFieldId?: string | null;
    courseCode?: string | null;
    preference?: AllocationFormTemplatePreferenceFieldType | null;
    takenConsecutively?: boolean | null;
};

export type AllocationFormResponse = RawAllocationFormResponse & {
    id: string;
    course: Pick<Course, "name" | "code"> | null;
    templateField: AllocationFormTemplateField;
    submittedBy: Pick<MemberDetailsResponse, "name" | "email">;
    submittedAt: Date;
};

export type PreferredFaculty = RawAllocationFormResponse & {
    submittedBy: MemberDetailsResponse;
    templateField: NewAllocationFormTemplateField;
};
