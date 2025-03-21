import z from "zod";

export const assignBodySchema = z.object({
    courseName: z.string().nonempty(),
    courseCode: z.string().nonempty(),
    icEmail: z.string().email(),
    reviewerEmail: z.string().email(),
});

export type AssignBody = z.infer<typeof assignBodySchema>;

export const handoutStatuses = [
    "pending",
    "approved",
    "rejected",
    "notsubmitted",
] as const;

export const getFacultyHandoutsQuerySchema = z.object({
    icEmail: z.string().email(),
});

export type getFacultyHandouts = z.infer<typeof getFacultyHandoutsQuerySchema>;
