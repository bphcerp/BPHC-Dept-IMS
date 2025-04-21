import z from "zod";

export const qpReviewStatuses = [
    "review pending",
    "reviewed",
    "approved",
    "rejected",
    "notsubmitted",
] as const;


export type QpStatus = (typeof qpReviewStatuses)[number];

export const categories = ["HD", "FD"] as const;

export const assignICBodySchema = z.object({
    courseName: z.string().nonempty(),
    courseCode: z.string().nonempty(),
    icEmail: z.string().email(),
    category: z.enum(categories),
});

export type AssignICBody = z.infer<typeof assignICBodySchema>;

export const updateIcBodySchema = z.object({
    id: z
        .string()
        .nonempty()
        .refine((val) => !isNaN(Number(val)), {
            message: "Invalid qp id",
        }),
    icEmail: z.string().email(),
});

export type UpdateICBody = z.infer<typeof updateIcBodySchema>;

export const createQpReviewSchema = z.object({
    courseName: z.string().nonempty(),
    courseNo: z.string().nonempty(),
    dcaMemberEmail: z.string().email(),
    fic: z.string().email(),
    ficDeadline: z.string().datetime(),
    reviewDeadline: z.string().datetime(),
});

export type CreateQpReview = z.infer<typeof createQpReviewSchema>;

const reviewFieldSchema = z.object({
    language: z.string().default(""),
    length: z.string().default(""),
    mixOfQuestions: z.string().default(""),
    coverLearning: z.string().default(""),
    solution: z.string().default(""),
    remarks: z.string().optional().default(""),
});

export const submitQpReviewSchema = z.object({
    requestId: z.number().int().positive("Invalid request ID"),
    email: z.string().email("Invalid email format"),
    review: z.record(z.string(), reviewFieldSchema),
});

export type SubmitQpReview = z.infer<typeof submitQpReviewSchema>;
export const qpReviewResponseSchema = z
    .object({
        faculty1Email: z.string().email(),
        faculty2Email: z.string().email(),
        review1: z.any().optional(),
        review2: z.any().optional(),
        reviewed: z.string().optional(),
    })
    .passthrough();

export type QpReviewResponse = z.infer<typeof qpReviewResponseSchema>;

export const getQpReviewQuerySchema = z.object({
    reviewId: z
        .string()
        .nonempty()
        .refine((val) => !isNaN(Number(val)), {
            message: "Invalid review id",
        }),
});

export type GetQpReviewQuery = z.infer<typeof getQpReviewQuerySchema>;

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

export const editQpReviewSchema = z.object({
    courseName: z.string().nonempty().optional(),
    courseNo: z.string().nonempty().optional(),
    dcaMemberEmail: z.string().email().optional(),
    ficEmail: z.string().email().optional(),
    faculty1Email: z.string().email().optional(),
    faculty2Email: z.string().email().optional(),
    ficDeadline: z.string().datetime().optional(),
    reviewDeadline: z.string().datetime().optional(),
    status: z
        .enum(["pending", "approved", "rejected", "inprogress"])
        .optional(),
});

export type EditQpReview = z.infer<typeof editQpReviewSchema>;

export const uploadDocumentsSchema = z.object({
    id: z
        .string({
            required_error: "Request ID is required",
            invalid_type_error: "Request ID must be a string",
        })
        .min(1, "Request ID cannot be empty")
        .refine((val) => !isNaN(Number(val)), {
            message: "Invalid request ID",
        }),
        field: z.string()
});

export type UploadFICDocuments = z.infer<typeof uploadDocumentsSchema>;

export const requestIdSchema = z.object({
    requestId: z.preprocess(
        (val) => Number(val), // Convert string to number
        z.number().int().positive() // Ensure it's a positive integer
    ),
});

export type RequestId = z.infer<typeof requestIdSchema>;
