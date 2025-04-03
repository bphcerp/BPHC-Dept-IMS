import z from "zod";

export const qpReviewStatuses = [
    "pending",
    "approved",
    "rejected",
    "inprogress",
] as const;

export type QPReviewStatus = (typeof qpReviewStatuses)[number];

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
    review: z.record(z.string(), reviewFieldSchema)
});


export type SubmitQpReview = z.infer<typeof submitQpReviewSchema>;
export const qpReviewResponseSchema = z.object({
    faculty1Email: z.string().email(),
    faculty2Email: z.string().email(),
    review1: z.any().optional(),
    review2: z.any().optional(),
    reviewed: z.string().optional(),
  }).passthrough();

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

export const assignQpReviewerSchema = z.object({
    id: z
        .string()
        .nonempty()
        .refine((val) => !isNaN(Number(val)), {
            message: "Invalid review id",
        }),
    faculty1Email: z.string() || null,
    faculty2Email: z.string() || null,
});

export type AssignQpReviewer = z.infer<typeof assignQpReviewerSchema>;

export const editQpReviewSchema = z.object({
    courseName: z.string().nonempty().optional(),
    courseNo: z.string().nonempty().optional(),
    dcaMemberEmail: z.string().email().optional(),
    ficEmail: z.string().email().optional(),
    faculty1Email: z.string().email().optional(),
    faculty2Email: z.string().email().optional(),
    ficDeadline: z.string().datetime().optional(),
    reviewDeadline: z.string().datetime().optional(),
    status: z.enum(["pending", "approved", "rejected", "inprogress"]).optional(),
});

export type EditQpReview = z.infer<typeof editQpReviewSchema>;

export const uploadFICDocumentsSchema = z.object({
    requestId: z.string().regex(/^\d+$/, "requestId must be a numeric string"),
    ficEmail: z.string().email("Invalid email format"),
});

export type UploadFICDocuments = z.infer<typeof uploadFICDocumentsSchema>;

export const requestIdSchema = z.object({
    requestId: z.preprocess(
      (val) => Number(val), // Convert string to number
      z.number().int().positive() // Ensure it's a positive integer
    ),
  });

export type RequestId = z.infer<typeof requestIdSchema>;

