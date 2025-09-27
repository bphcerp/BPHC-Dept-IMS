import { z } from "zod";

// All post-proposal and anytime requests are defined here.
export const phdRequestTypes = [
    // Post-Proposal Sequential Flow
    "pre_submission",
    "draft_notice",
    "change_of_title",
    "thesis_submission",
    "final_thesis_submission",

    // Anytime Requests
    "jrf_recruitment",
    "jrf_to_phd_conversion",
    "project_fellow_conversion",
    "manage_co_supervisor",
    "stipend_payment",
    "international_travel_grant",
    "rp_grades",
    "change_of_workplace",
    "semester_drop",
    "thesis_submission_extension",
    "endorsements",
    "phd_aspire_application",
    "not_registered_student",
] as const;

export const phdRequestStatuses = [
    "supervisor_draft",
    "supervisor_submitted",
    "drc_convener_review",
    "drc_member_review",
    "hod_review",
    "completed",
    "reverted_by_drc_convener",
    "reverted_by_drc_member",
    "reverted_by_hod",
    // Specific statuses for the final thesis workflow
    "student_review",
    "supervisor_review_final_thesis",
] as const;

export const phdRequestTypeEnum = z.enum(phdRequestTypes);
export const phdRequestStatusEnum = z.enum(phdRequestStatuses);

export const createRequestSchema = z.object({
    studentEmail: z.string().email(),
    requestType: phdRequestTypeEnum,
    comments: z.string().optional(),
});
export type CreateRequestBody = z.infer<typeof createRequestSchema>;

export const drcConvenerReviewSchema = z.object({
    comments: z.string().optional(),
    assignedDrcMembers: z.array(z.string().email()).max(8).optional(),
    action: z.enum(["forward_to_drc", "forward_to_hod", "revert", "approve"]),
});
export type DrcConvenerReviewBody = z.infer<typeof drcConvenerReviewSchema>;

export const reviewerSchema = z
    .object({
        approved: z.boolean(),
        comments: z.string().trim().optional(),
    })
    .refine(
        (data) => data.approved || (data.comments && data.comments.length > 0),
        {
            message: "Comments are required to revert a request.",
            path: ["comments"],
        }
    );
export type ReviewerBody = z.infer<typeof reviewerSchema>;

export const studentFinalThesisSchema = z.object({
    comments: z.string().optional(),
});
export type StudentFinalThesisBody = z.infer<typeof studentFinalThesisSchema>;

export const supervisorFinalThesisReviewSchema = z
    .object({
        comments: z.string().optional(),
        action: z.enum(["approve", "revert"]),
    })
    .refine(
        (data) =>
            data.action === "approve" ||
            (data.comments && data.comments.length > 0),
        {
            message: "Comments are required to revert to the student.",
            path: ["comments"],
        }
    );
export type SupervisorFinalThesisReviewBody = z.infer<
    typeof supervisorFinalThesisReviewSchema
>;
