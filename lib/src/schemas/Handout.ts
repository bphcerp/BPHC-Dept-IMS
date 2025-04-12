import z from "zod";

export const handoutStatuses = [
    "pending",
    "reviewed",
    "approved",
    "rejected",
    "notsubmitted",
] as const;

export const categories = ["HD", "FD"] as const;

export const assignICBodySchema = z.object({
    courseName: z.string().nonempty(),
    courseCode: z.string().nonempty(),
    icEmail: z.string().email(),
    category: z.enum(categories),
});

export type AssignICBody = z.infer<typeof assignICBodySchema>;

export type HandoutStatus = (typeof handoutStatuses)[number];

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

export const getReviewQuerySchema = z.object({
    handoutId: z
        .string()
        .nonempty()
        .refine((val) => !isNaN(Number(val)), {
            message: "Invalid handout id",
        }),
});

export type GetReviewQuery = z.infer<typeof getReviewQuerySchema>;

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

export const finalDecisionBodySchema = z.object({
    id: z
        .string()
        .nonempty()
        .refine((val) => !isNaN(Number(val)), {
            message: "Invalid handout id",
        }),
    comments: z.string(),
    status: z.enum(handoutStatuses),
});

export type FinalDecisionBody = z.infer<typeof finalDecisionBodySchema>;

export const updateICBodySchema = z.object({
    id: z
        .string()
        .nonempty()
        .refine((val) => !isNaN(Number(val)), {
            message: "Invalid handout id",
        }),
    icEmail: z.string().email(),
});

export type UpdateICBody = z.infer<typeof updateICBodySchema>;

export const updateReviewerBodySchema = z.object({
    id: z
        .string()
        .nonempty()
        .refine((val) => !isNaN(Number(val)), {
            message: "Invalid handout id",
        }),
    reviewerEmail: z.string().email(),
});

export type UpdateReviewerBody = z.infer<typeof updateReviewerBodySchema>;

export const deadlineBodySchema = z.object({
    time: z.date(),
});

export type DeadlineBody = z.infer<typeof deadlineBodySchema>;
