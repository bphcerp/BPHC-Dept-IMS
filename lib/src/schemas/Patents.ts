import { z } from "zod";

export const insertPatentsBodySchema = z.object({
    file: z.instanceof(Buffer, { message: "File must be uploaded" }), // Ensures a file is present
});

export const saveInventorEmailSchema = z.object({
    inventorName: z.string().min(1, "Inventor name is required"),
    newEmail: z.string().email("Invalid email format"),
});

export const updatePatentInventorEmailSchema = z.object({
    application_number: z.string().min(1, "Application number is required"),
    inventorIndex: z.number().min(0, "Inventor index must be a valid number"),
    newEmail: z.string().email("Invalid email format"),
});

export const addPatentFormSchema = z.object({
    application_number: z.string().min(1, "Application number is required"),
    inventors_name: z.string().min(1, "Inventors name is required"),
    department: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    campus: z.string().optional(),
    filing_date: z.string().optional(),
    application_publication_date: z.string().optional(),
    granted_date: z.string().optional(),
    filing_fy: z.string().optional(),
    filing_ay: z.string().optional(),
    published_ay: z.string().optional(),
    published_fy: z.string().optional(),
    granted_fy: z.string().optional(),
    granted_ay: z.string().optional(),
    granted_cy: z.string().optional(),
    status: z.enum(["filed", "granted"], {
        message: "Status must be 'filed' or 'granted'",
    }),
}).refine((data) => (data.status === "granted" ? !!data.granted_date : true), {
    message: "Grant date is required if status is 'granted'",
    path: ["granted_date"],
});

export const getPatentsByInventorParamsSchema = z.object({
    name: z.string().min(1, "Inventor name is required"),
});

export const getAllPatentsQuerySchema = z.object({
    inventor: z.string().optional(), // Optional query parameter for filtering by inventor name
});

export const patentsSchemas = {
    insertPatentsBodySchema,
    saveInventorEmailSchema,
    updatePatentInventorEmailSchema,
    addPatentFormSchema,
    getPatentsByInventorParamsSchema,
    getAllPatentsQuerySchema,
};

export type InsertPatentsBody = z.infer<typeof insertPatentsBodySchema>;
export type SaveInventorEmail = z.infer<typeof saveInventorEmailSchema>;
export type UpdatePatentInventorEmail = z.infer<typeof updatePatentInventorEmailSchema>;
export type AddPatentForm = z.infer<typeof addPatentFormSchema>;
export type GetPatentsByInventorParams = z.infer<typeof getPatentsByInventorParamsSchema>;
export type GetAllPatentsQuery = z.infer<typeof getAllPatentsQuerySchema>;
