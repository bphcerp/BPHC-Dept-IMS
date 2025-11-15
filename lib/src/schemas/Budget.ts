import { z } from "zod";

export const budgetHeadTypeEnum = z.enum(["COPEX", "OPEX", "BOTH"]);

export const nfaStatusEnum = z.enum([
  "Pending",
  "Approved by Convener",
  "Rejected by Convener",
  "Approved by HoD",
  "Rejected by HoD",
]);

export const masterbudgetSchema = z.object({
  id: z.string().uuid().optional(),
  year: z.number().int(),
  totalAllocated: z.number(),
  headAllocations: z.array(z.string().uuid()).optional(),
  initiatedByEmail: z.string().email(),
  convenerEmail: z.string().email(),
  createdAt: z.coerce.date().optional(),
});

export const updateMasterbudgetSchema = masterbudgetSchema.partial().extend({
  id: z.string().uuid(),
});

export const budgetHeadSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().nonempty(),
  description: z.string().trim().nonempty(),
  type: budgetHeadTypeEnum,
});

export const updateBudgetHeadSchema = budgetHeadSchema.partial().extend({
  id: z.string().uuid(),
});


export const headItemSchema = z.object({
  id: z.string().uuid().optional(),
  itemName: z.string().trim().nonempty(),
  headAllocId: z.string().uuid(),
  grantedAmount: z.number(),
  labId: z.string().uuid(),
});

export const updateHeadItemSchema = headItemSchema.partial().extend({
  id: z.string().uuid(),
});

export const multipleHeadItemEntrySchema = z.array(headItemSchema);

export const budgetHeadAllocationSchema = z.object({
  id: z.string().uuid().optional(),
  budgetId: z.string().uuid(), // FK → master_budget.id
  headId: z.string().uuid(), // FK → budget_head.id
  items: z.array(z.string().uuid()).optional(),
  allocationAmount: z.number(),
  budgetCode: z.number().int(),
  analysisCode: z.number().int(),
});

export const updateBudgetHeadAllocationSchema =
  budgetHeadAllocationSchema.partial().extend({
    id: z.string().uuid(),
  });


export const nfaRequestSchema = z.object({
  id: z.string().uuid().optional(),
  createdByEmail: z.string().email(), // FK → users.email
  itemId: z.string().uuid(), // FK → head_item.id
  technicalDescription: z.string().trim().nonempty(),
  status: nfaStatusEnum,
  createdAt: z.coerce.date().optional(),
});

export const updateNfaRequestSchema = nfaRequestSchema.partial().extend({
  id: z.string().uuid(),
});