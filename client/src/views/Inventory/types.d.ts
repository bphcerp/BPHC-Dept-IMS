import { inviteMemberBodySchema } from "node_modules/lib/src/schemas/Admin";
import { categorySchema, facultySchema, inventoryItemSchema, laboratorySchema, staffSchema, vendorSchema } from "node_modules/lib/src/schemas/Inventory";
import { z } from "zod";


export interface SheetInfo {
    sheetName: string;
    columnOffset: number;
    dataOffset: number;
    columnIndexMap: Record<string, number>;
};

export type Faculty = z.infer<typeof facultySchema>
export type Staff = z.infer<typeof staffSchema>
export type Laboratory = z.infer<typeof laboratorySchema>;
export type Vendor = z.infer<typeof vendorSchema> & {
    categories: Category[];
};
export type Category = z.infer<typeof categorySchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export interface NewLaboratoryRequest extends Omit<Laboratory, "technicianInCharge" | "facultyInCharge" | "createdAt" | "updatedAt"> {
    technicianInCharge: string;
    facultyInCharge: string;
}

export interface NewVendorRequest extends Omit<Vendor, "id" | "categories" | "createdAt" | "updatedAt"> {
    categories: string[]; // Array of category IDs
}

export type NewCategoryRequest = Omit<Category, "id" | "createdAt" | "updatedAt">