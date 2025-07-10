import z from "zod";

export const wilpProjectSchema = z.object({
    studentId: z.string().min(1, "Student ID is required"),
    discipline: z.string().min(1, "Discipline is required"),
    studentName: z.string().min(1, "Student name is required"),
    organization: z.string().min(1, "Organization is required"),
    degreeProgram: z.enum([
        "B.Tech. Engineering Technology",
        "M.Tech. Design Engineering",
        "B.Tech. Power Engineering",
        "MBA in Quality Management",
        "MBA in Manufacturing Management",
        "M.Tech. Quality Management",
        "M.Tech. Manufacturing Management",
    ]),
    facultyEmail: z.string().email("Invalid faculty email").optional(),
    researchArea: z.string().min(1, "Research area is required"),
    dissertationTitle: z.string().min(1, "Dissertation title is required"),
    reminder: z.date(),
    deadline: z.date(),
});

export type WilpProjectFormValues = z.infer<typeof wilpProjectSchema>;

export const wilpProjectUploadSchema = z.object({
    reminder: z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), {
            message: "Reminder must be a valid ISO date string",
        })
        .transform((date) => new Date(date)),
    deadline: z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), {
            message: "Deadline must be a valid ISO date string",
        })
        .transform((date) => new Date(date)),
});
export type wilpProjectUploadBody = z.infer<typeof wilpProjectUploadSchema>;

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
    reminder: Date;
    deadline: Date;
    createdAt: Date;
    updatedAt: Date;
};
