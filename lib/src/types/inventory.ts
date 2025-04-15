import { facultySchema, staffSchema, laboratorySchema, vendorSchema, categorySchema, inventoryItemSchema } from "@/schemas/Inventory.ts";
import { z } from "zod";

export type Faculty = z.infer<typeof facultySchema>
export type Staff = z.infer<typeof staffSchema>
export type Laboratory = Omit<z.infer<typeof laboratorySchema>, "technicianInChargeEmail" | "facultyInChargeEmail"> & {
    technicianInCharge: Staff;
    facultyInCharge: Faculty;
};
export type Vendor = z.infer<typeof vendorSchema> & {
    categories: Category[];
};
export type Category = z.infer<typeof categorySchema>;
export type InventoryItem = Omit<z.infer<typeof inventoryItemSchema>, "labId" | "itemCategoryId" | "transferId" | "vendorId"> &{
    lab: Laboratory
    itemCategory: Category
    transfer: InventoryItem | null
    vendor: Vendor
}

export interface NewLaboratoryRequest extends Omit<Laboratory, "technicianInCharge" | "facultyInCharge" | "createdAt" | "updatedAt"> {
    technicianInChargeEmail: string;
    facultyInChargeEmail: string;
}

export interface NewVendorRequest extends Omit<Vendor, "id" | "categories" | "createdAt" | "updatedAt"> {
    categories: string[]; // Array of category IDs
}

export type NewCategoryRequest = Omit<Category, "id" | "createdAt" | "updatedAt">