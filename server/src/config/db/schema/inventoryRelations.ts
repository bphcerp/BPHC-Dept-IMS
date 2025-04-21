import { relations } from "drizzle-orm";
import { staff, faculty } from "./admin.ts";
import {
    inventoryItems,
    laboratories,
    inventoryCategories,
    vendors,
} from "./inventory.ts";

export const laboratoriesRelations = relations(laboratories, ({ one }) => ({
    technicianInCharge: one(staff, {
        fields: [laboratories.technicianInChargeEmail],
        references: [staff.email],
        relationName: "technicianInCharge",
    }),
    facultyInCharge: one(faculty, {
        fields: [laboratories.facultyInChargeEmail],
        references: [faculty.email],
        relationName: "facultyInCharge",
    }),
}));

export const inventoryItemRelations = relations(inventoryItems, ({ one }) => ({
    transfer: one(inventoryItems, {
        fields: [inventoryItems.transferId],
        references: [inventoryItems.id],
        relationName: "transfer",
    }),
    lab: one(laboratories, {
        fields: [inventoryItems.labId],
        references: [laboratories.id],
        relationName: "lab",
    }),
    itemCategory: one(inventoryCategories, {
        fields: [inventoryItems.itemCategoryId],
        references: [inventoryCategories.id],
        relationName: "itemCategory",
    }),
    vendor: one(vendors, {
        fields: [inventoryItems.vendorId],
        references: [vendors.id],
        relationName: "vendor",
    }),
}));
