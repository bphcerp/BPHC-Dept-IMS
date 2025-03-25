import z from "zod";

export const assignICBodySchema = z.object({
    courseName: z.string().nonempty(),
    courseCode: z.string().nonempty(),
    icEmail: z.string().email(),
});

export type AssignICBody = z.infer<typeof assignICBodySchema>;

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
});

export type CreateHandoutDCAMemberReviewBody = z.infer<
    typeof createHandoutDCAMemberReviewBodySchema
>;
export const submitHandoutQuerySchema = z.object({
    id: z
        .string()
        .nonempty()
        .refine((val) => !isNaN(Number(val)), {
            message: "Invalid handout id",
        }),
});

export type SubmitHandoutParams = z.infer<typeof submitHandoutQuerySchema>;

export const assignReviewerBodySchema = z.object({
    id: z
        .string()
        .nonempty()
        .refine((val) => !isNaN(Number(val)), {
            message: "Invalid handout id",
        }),
    reviewerEmail: z.string().email(),
});

export type AssignReviewerBody = z.infer<typeof assignReviewerBodySchema>;
