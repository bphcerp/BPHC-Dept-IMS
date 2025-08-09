import z from "zod";

export const handoutStatuses = [
    "review pending",
    "reviewed",
    "approved",
    "revision requested",
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
    ncCriteria: z.coerce.boolean(),
    comments: z.string(),
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
    emailBody: z.string().min(1),
});

export type DeadlineBody = z.infer<typeof deadlineBodySchema>;

export const handoutUploadBodySchema = z.object({
    midSem: z.coerce.number().refine((val) => val >= 20 && val <= 35, {
        message: "Midsem weightage should be between 20-35%",
    }),
    compre: z.coerce.number().refine((val) => val >= 30 && val <= 45, {
        message: "Compre weightage should be between 30-45%",
    }),
    openBook: z.coerce.number().refine((val) => val >= 20, {
        message: "Open book components should be >= 20%",
    }),
    otherEvals: z.coerce.number(),
});

export type handoutUploadBody = z.infer<typeof handoutUploadBodySchema>;
