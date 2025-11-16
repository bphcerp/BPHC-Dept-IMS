import { relations } from "drizzle-orm";
import { users, faculty } from "./admin.ts";
import { laboratories, inventoryItems } from "./inventory.ts";
import {
    masterBudget,
    budgetHead,
    budgetHeadAllocation,
    headItems,
    nfaRequest,
} from "./budget.ts";

// Relations for Master Budget
export const masterBudgetRelations = relations(masterBudget, ({ one, many }) => ({
    initiatedBy: one(users, {
        fields: [masterBudget.initiatedByEmail],
        references: [users.email],
        relationName: "masterBudgetInitiatedBy",
    }),
    convener: one(faculty, {
        fields: [masterBudget.convenerEmail],
        references: [faculty.email],
        relationName: "masterBudgetConvener",
    }),
    headAllocations: many(budgetHeadAllocation),
}));

// Relations for Budget Head
export const budgetHeadRelations = relations(budgetHead, ({ many }) => ({
    allocations: many(budgetHeadAllocation),
}));

// Relations for Budget Head Allocation
export const budgetHeadAllocationRelations = relations(
    budgetHeadAllocation,
    ({ one, many }) => ({
        budget: one(masterBudget, {
            fields: [budgetHeadAllocation.budgetId],
            references: [masterBudget.id],
            relationName: "allocationBudgetMaster",
        }),
        head: one(budgetHead, {
            fields: [budgetHeadAllocation.headId],
            references: [budgetHead.id],
            relationName: "allocationBudgetHead",
        }),
        items: many(headItems),
    })
);

// Relations for Head Items
export const headItemsRelations = relations(headItems, ({ one }) => ({
    headAllocation: one(budgetHeadAllocation, {
        fields: [headItems.headAllocId],
        references: [budgetHeadAllocation.id],
        relationName: "itemHeadAllocation",
    }),
    lab: one(laboratories, {
        fields: [headItems.labId],
        references: [laboratories.id],
        relationName: "itemLab",
    }),
}));

// Relations for NFA Request
export const nfaRequestRelations = relations(nfaRequest, ({ one }) => ({
    createdBy: one(users, {
        fields: [nfaRequest.createdByEmail],
        references: [users.email],
        relationName: "nfaRequestCreatedBy",
    }),
    item: one(inventoryItems, {
        fields: [nfaRequest.itemId],
        references: [inventoryItems.id],
        relationName: "nfaRequestItem",
    }),
}));