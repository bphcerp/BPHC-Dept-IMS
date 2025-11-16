import {
    pgTable,
    integer,
    text,
    decimal,
    timestamp,
    pgEnum,
    uuid,
    index,
} from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";
import { faculty, users } from "./admin.ts";
import { laboratories, inventoryItems } from "./inventory.ts";

export const budgetHeadTypeEnum = pgEnum("budget_head_type", [
    "capex",
    "opex",
    "both",
]);

export const nfaRequestStatusEnum = pgEnum("nfa_request_status", [
    "Pending",
    "Approved_Convener",
    "Rejected_Convener",
    "Approved_HoD",
    "Rejected_HoD",
]);

// --- Tables ---

export const masterBudget = pgTable(
    "budget_master",
    {
        id: uuid("id")
            .primaryKey()
            .$defaultFn(() => uuidv4()),
        year: integer("year").notNull(),
        totalAllocated: decimal("total_allocated", {
            precision: 15,
            scale: 2,
        }).notNull(),
        initiatedByEmail: text("initiated_by_email")
            .references(() => users.email, { onDelete: "set null" })
            .notNull(),
        convenerEmail: text("convener_email")
            .references(() => faculty.email, { onDelete: "set null" })
            .notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull()
            .$onUpdate(() => new Date()),
    },
    (table) => [
        index().on(table.initiatedByEmail),
        index().on(table.convenerEmail),
    ]
);

export const budgetHead = pgTable("budget_heads", {
    id: uuid("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),
    name: text("name").notNull(),
    description: text("description"),
    type: budgetHeadTypeEnum("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
});

export const budgetHeadAllocation = pgTable(
    "budget_head_allocations",
    {
        id: uuid("id")
            .primaryKey()
            .$defaultFn(() => uuidv4()),
        budgetId: uuid("budget_id")
            .references(() => masterBudget.id, { onDelete: "cascade" })
            .notNull(),
        headId: uuid("head_id")
            .references(() => budgetHead.id, { onDelete: "restrict" })
            .notNull(),
        allocationAmount: decimal("allocation_amount", {
            precision: 15,
            scale: 2,
        }).notNull(),
        budgetCode: integer("budget_code"),
        analysisCode: integer("analysis_code"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull()
            .$onUpdate(() => new Date()),
    },
    (table) => [index().on(table.budgetId), index().on(table.headId)]
);

export const headItems = pgTable(
    "budget_head_items",
    {
        id: uuid("id")
            .primaryKey()
            .$defaultFn(() => uuidv4()),
        itemName: text("item_name").notNull(),
        headAllocId: uuid("head_alloc_id")
            .references(() => budgetHeadAllocation.id, { onDelete: "cascade" })
            .notNull(),
        grantedAmt: decimal("granted_amt", {
            precision: 15,
            scale: 2,
        }).notNull(),
        labId: uuid("lab_id")
            .references(() => laboratories.id, { onDelete: "restrict" })
            .notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull()
            .$onUpdate(() => new Date()),
    },
    (table) => [index().on(table.headAllocId), index().on(table.labId)]
);

export const nfaRequest = pgTable(
    "budget_nfa_requests",
    {
        id: uuid("id")
            .primaryKey()
            .$defaultFn(() => uuidv4()),
        createdByEmail: text("created_by_email")
            .references(() => users.email, { onDelete: "set null" })
            .notNull(),
        itemId: uuid("item_id")
            .references(() => inventoryItems.id, { onDelete: "restrict" })
            .notNull(),
        technicalDescription: text("technical_description"),
        status: nfaRequestStatusEnum("status").default("Pending").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull()
            .$onUpdate(() => new Date()),
    },
    (table) => [index().on(table.createdByEmail), index().on(table.itemId)]
);