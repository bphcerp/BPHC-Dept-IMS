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

export const createHandoutDCAMemberReviewBodySchema = z.object({
    handoutId: z.coerce.number(),
    scopeAndObjective: z.coerce.boolean(),
    textBookPrescribed: z.coerce.boolean(),
    lecturewisePlanLearningObjective: z.coerce.boolean(),
    lecturewisePlanCourseTopics: z.coerce.boolean(),
    numberOfLP: z.coerce.boolean(),
    evaluationScheme: z.coerce.boolean(),
})

export type CreateHandoutDCAMemberReviewBody = z.infer<typeof createHandoutDCAMemberReviewBodySchema>;