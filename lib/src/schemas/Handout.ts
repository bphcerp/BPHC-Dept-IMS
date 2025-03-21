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
