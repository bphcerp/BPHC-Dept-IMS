import z from "zod";

export const updatePhdGradeBodySchema = z.object({
    studentEmail: z.string().email(),
    courseGrades: z.array(z.string()).nonempty(),
});

export type UpdatePhdGradeBody = z.infer<typeof updatePhdGradeBodySchema>;

export const updatePhdCoursesBodySchema = z.object({
    studentEmail: z.string().email(),
    courseNames: z.array(z.string()).nonempty(),
    courseUnits: z.array(z.number()).nonempty(),
});

export type UpdatePhdCoursesBody = z.infer<typeof updatePhdCoursesBodySchema>;
