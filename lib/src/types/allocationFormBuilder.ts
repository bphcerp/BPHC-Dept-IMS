import { z } from "zod";
import {
	allocationFormTemplateFieldTypeEnum,
	allocationFormTemplateFieldOptionSchema,
	allocationFormTemplateFieldSchema,
	allocationFormTemplateSchema,
	allocationFormSchema,
	allocationFormResponseSchema,
	allocationFormResponseValueSchema,
	allocationFormResponseAnswerSchema,
    deleteAllocationFormResponseAnswerSchema,
    deleteAllocationFormResponseSchema,
    deleteAllocationFormResponseValueSchema,
    deleteAllocationFormSchema,
    deleteAllocationFormTemplateFieldOptionSchema,
    deleteAllocationFormTemplateFieldSchema,
    deleteAllocationFormTemplateSchema,
    updateAllocationFormResponseAnswerSchema,
    updateAllocationFormResponseSchema,
    updateAllocationFormResponseValueSchema,
    updateAllocationFormSchema,
    updateAllocationFormTemplateFieldOptionSchema,
    updateAllocationFormTemplateFieldSchema,
    updateAllocationFormTemplateSchema
} from "../schemas/AllocationFormBuilder.ts";
import { MemberDetailsResponse } from "@/schemas/Admin.ts";

export type NewAllocationFormTemplateFieldOption = z.infer<typeof allocationFormTemplateFieldOptionSchema>;
export type NewAllocationFormTemplateField = z.infer<typeof allocationFormTemplateFieldSchema>;
export type NewAllocationFormTemplate = z.infer<typeof allocationFormTemplateSchema>;
export type NewAllocationForm = z.infer<typeof allocationFormSchema>;
export type NewAllocationFormResponse = z.infer<typeof allocationFormResponseSchema>;
export type NewAllocationFormResponseValue = z.infer<typeof allocationFormResponseValueSchema>;
export type NewAllocationFormResponseAnswer = z.infer<typeof allocationFormResponseAnswerSchema>;

export type UpdateAllocationFormTemplateFieldOption = z.infer<typeof updateAllocationFormTemplateFieldOptionSchema>;
export type UpdateAllocationFormTemplateField = z.infer<typeof updateAllocationFormTemplateFieldSchema>;
export type UpdateAllocationFormTemplate = z.infer<typeof updateAllocationFormTemplateSchema>;
export type UpdateAllocationForm = z.infer<typeof updateAllocationFormSchema>;
export type UpdateAllocationFormResponse = z.infer<typeof updateAllocationFormResponseSchema>;
export type UpdateAllocationFormResponseValue = z.infer<typeof updateAllocationFormResponseValueSchema>;
export type UpdateAllocationFormResponseAnswer = z.infer<typeof updateAllocationFormResponseAnswerSchema>;

export type DeleteAllocationFormTemplateFieldOption = z.infer<typeof deleteAllocationFormTemplateFieldOptionSchema>;
export type DeleteAllocationFormTemplateField = z.infer<typeof deleteAllocationFormTemplateFieldSchema>;
export type DeleteAllocationFormTemplate = z.infer<typeof deleteAllocationFormTemplateSchema>;
export type DeleteAllocationForm = z.infer<typeof deleteAllocationFormSchema>;
export type DeleteAllocationFormResponse = z.infer<typeof deleteAllocationFormResponseSchema>;
export type DeleteAllocationFormResponseValue = z.infer<typeof deleteAllocationFormResponseValueSchema>;
export type DeleteAllocationFormResponseAnswer = z.infer<typeof deleteAllocationFormResponseAnswerSchema>;

export type AllocationFormTemplateFieldType = z.infer<typeof allocationFormTemplateFieldTypeEnum>;

// GET TYPES WITH RELATIONS
export type AllocationFormTemplateFieldOption = NewAllocationFormTemplateFieldOption & {
	id: string;
	field?: AllocationFormTemplateField;
};

export type AllocationFormTemplateField = NewAllocationFormTemplateField & {
	id: string;
	template?: AllocationFormTemplate;
	options?: AllocationFormTemplateFieldOption[];
	responseValues?: AllocationFormResponseValue[];
};

export type AllocationFormTemplate = NewAllocationFormTemplate & {
	id: string;
	fields?: AllocationFormTemplateField[];
	createdBy: MemberDetailsResponse;  
};

// Use this for the template/getAll endpoint
export type AllocationFormTemplateList = Omit<NewAllocationFormTemplate, 'fields'> & {
	id: string;
	createdBy: Pick<MemberDetailsResponse, 'name' | 'email'>;  
};

export type AllocationForm = NewAllocationForm & {
	id: string;
	template?: AllocationFormTemplate;
	createdBy: MemberDetailsResponse
	responses?: AllocationFormResponse[];
};

// Use this for the form/getAll endpoint
export type AllocationFormList = NewAllocationForm & {
	id: string
	template: Pick<AllocationFormTemplate, 'id' | 'name'>;
	createdBy: Pick<MemberDetailsResponse, 'name' | 'email'>;
};

export type AllocationFormResponse = Omit<NewAllocationFormResponse, 'answers'> & {
	id: string;
	submittedBy: MemberDetailsResponse;  
  	submittedAt: Date;    
	values?: AllocationFormResponseValue[];
};

export type AllocationFormResponseValue = NewAllocationFormResponseValue & {
	id: string;
	response?: AllocationFormResponse;
	field?: AllocationFormTemplateField;
	answers?: AllocationFormResponseAnswer[];
};

export type AllocationFormResponseAnswer = NewAllocationFormResponseAnswer & {
	id: string;
	responseValue?: AllocationFormResponseValue;
	option?: AllocationFormTemplateFieldOption;
};
