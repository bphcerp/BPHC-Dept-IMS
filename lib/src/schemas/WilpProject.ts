import z from "zod";

export const wilpProjectSchema = z.object({
    studentId: z.string().min(1, "Student ID is required"),
    discipline: z.string().min(1, "Discipline is required"),
    studentName: z.string().min(1, "Student name is required"),
    organization: z.string().min(1, "Organization is required"),
    degreeProgram: z.string().min(1, "Degree program is required"),
    facultyEmail: z.string().email("Invalid faculty email").optional(),
    researchArea: z.string().min(1, "Research area is required"),
    dissertationTitle: z.string().min(1, "Dissertation title is required"),
});

export type WilpProjectFormValues = z.infer<typeof wilpProjectSchema>;

export const wilpProjectViewDetailsQuerySchema = z.object({
    id: z
        .string()
        .refine((value) => Number.isInteger(Number(value)), {
            message: "ID must be a valid integer string",
        })
        .transform((value) => Number(value)),
});
export type WilpProjectViewDetailsQuery = z.infer<
    typeof wilpProjectViewDetailsQuerySchema
>;

export const wilpProjectSelectBodySchema = z.object({
    idList: z.array(z.number()).min(1, "idList cannot be empty"),
});
export type WilpProjectSelectBody = z.infer<typeof wilpProjectSelectBodySchema>;

export const wilpProjectSetRangeBodySchema = z.object({
    min: z.number().int().min(0, "Minimum must be a non-negative integer"),
    max: z.number().int().min(0, "Maximum must be a non-negative integer"),
});

export type WilpProjectSetRangeBody = z.infer<
    typeof wilpProjectSetRangeBodySchema
>;

export const wilpProjectBulkMailSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    text: z.string().min(1, "Body is required"),
    includeFaculty: z.boolean(),
    additionalMailList: z.array(z.string()).optional(),
});
export type WilpProjectBulkMailBody = z.infer<typeof wilpProjectBulkMailSchema>;

export type WilpProject = {
    id: number;
    studentId: string;
    discipline: string;
    studentName: string;
    organization: string;
    degreeProgram: string;
    facultyEmail?: string;
    researchArea: string;
    dissertationTitle: string;
    createdAt: Date;
    updatedAt: Date;
};
