// lib/src/schemas/PhdRequest.ts
import { z } from "zod";

export const phdRequestTypes = [
    // Post-Proposal Sequential
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
    "student_review", // For final thesis submission
    "supervisor_review_final_thesis", // For final thesis submission
] as const;

export const phdRequestTypeEnum = z.enum(phdRequestTypes);
export const phdRequestStatusEnum = z.enum(phdRequestStatuses);

// Supervisor creates a request
export const createRequestSchema = z.object({
    studentEmail: z.string().email(),
    requestType: phdRequestTypeEnum,
    comments: z.string().optional(),
});
export type CreateRequestBody = z.infer<typeof createRequestSchema>;

// DRC Convener reviews a request
export const drcConvenerReviewSchema = z.object({
    comments: z.string().optional(),
    assignedDrcMembers: z.array(z.string().email()).max(8).optional(),
    action: z.enum(["forward_to_drc", "forward_to_hod", "revert", "approve"]),
});
export type DrcConvenerReviewBody = z.infer<typeof drcConvenerReviewSchema>;

// DRC Member / HOD submits their review
export const reviewerSchema = z.object({
    comments: z.string().trim().min(1, "Comments are required to revert."),
    approved: z.boolean(),
});
export type ReviewerBody = z.infer<typeof reviewerSchema>;

// Student's Final Thesis Submission
export const studentFinalThesisSchema = z.object({
    comments: z.string().optional(),
});
export type StudentFinalThesisBody = z.infer<typeof studentFinalThesisSchema>;

// Supervisor's Final Thesis Submission Review
export const supervisorFinalThesisReviewSchema = z.object({
    comments: z.string().optional(),
    action: z.enum(["approve", "revert"]),
});
export type SupervisorFinalThesisReviewBody = z.infer<
    typeof supervisorFinalThesisReviewSchema
>;
