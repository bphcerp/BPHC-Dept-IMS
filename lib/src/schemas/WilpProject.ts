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
