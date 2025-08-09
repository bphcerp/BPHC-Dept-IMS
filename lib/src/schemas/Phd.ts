import { z } from "zod";

// Shared Enums
export const examTypes = ['QualifyingExam', 'ThesisProposal'] as const;
export const applicationStatuses = ['Applied', 'Approved', 'Rejected', 'Withdrawn'] as const;
export const suggestionStatuses = ['Pending', 'Submitted'] as const;

// Helper schema for YYYY-MM-DDTHH:mm format from <input type="datetime-local">
const localDateTimeSchema = z.string().regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/,
    "Invalid datetime-local format. Expected YYYY-MM-DDTHH:mm"
);

//============================================
//== Staff Schemas
//============================================
export const createExamEventSchema = z.object({
    type: z.enum(examTypes),
    name: z.string().min(1, "Event name is required"),
    semesterId: z.number().int().positive(),
    // ✅ CORRECTED: All date fields are now required
    registrationDeadline: localDateTimeSchema.min(1, "Registration deadline is required"),
    examStartDate: localDateTimeSchema.min(1, "Exam start date is required"),
    examEndDate: localDateTimeSchema.min(1, "Exam end date is required"),
    vivaDate: localDateTimeSchema.min(1, "Viva date is required"),
});
export type CreateExamEventBody = z.infer<typeof createExamEventSchema>;

export const updateSubAreasSchema = z.object({
    subAreas: z.array(z.object({ subarea: z.string().min(1) })).nonempty(),
});
export type UpdateSubAreasBody = z.infer<typeof updateSubAreasSchema>;

export const createSemesterSchema = z.object({
    academicYear: z.string(),
    semesterNumber: z.number().int().min(1).max(2),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});
export type CreateSemesterBody = z.infer<typeof createSemesterSchema>;


//============================================
//== Student Schemas
//============================================
export const applyForQESchema = z.object({
    examEventId: z.string().transform(Number),
    qualifyingArea1: z.string().min(1),
    qualifyingArea2: z.string().min(1),
});
export type ApplyForQEBody = z.infer<typeof applyForQESchema>;

// For frontend form validation that includes the file
export const applyForQEFormSchema = applyForQESchema.extend({
    applicationForm: z.instanceof(File, { message: "Application form is required" }),
});
export type ApplyForQEForm = z.infer<typeof applyForQEFormSchema>;

export const updateQEApplicationSchema = z.object({
    qualifyingArea1: z.string().min(1).optional(),
    qualifyingArea2: z.string().min(1).optional(),
    status: z.enum(['Withdrawn']).optional(),
});
export type UpdateQEApplicationBody = z.infer<typeof updateQEApplicationSchema>;

export const uploadProposalSchema = z.object({
    supervisor: z.string().email(),
    coSupervisor1: z.string().email().optional().nullable(),
    coSupervisor2: z.string().email().optional().nullable(),
});
export type UploadProposalBody = z.infer<typeof uploadProposalSchema>;

// For frontend form validation that includes files
export const uploadProposalFormSchema = uploadProposalSchema.extend({
    proposalDocument1: z.instanceof(File, { message: "Document 1 is required" }),
    proposalDocument2: z.instanceof(File, { message: "Document 2 is required" }),
    proposalDocument3: z.instanceof(File, { message: "Document 3 is required" }),
});
export type UploadProposalForm = z.infer<typeof uploadProposalFormSchema>;


//============================================
//== Supervisor / Co-Supervisor Schemas
//============================================
export const reviewProposalSchema = z.object({
    status: z.enum(["approved", "rejected"]),
    comments: z.string().optional(),
    studentEmail: z.string().email(),
});
export type ReviewProposalBody = z.infer<typeof reviewProposalSchema>;

export const suggestDacMembersSchema = z.object({
    dacMembers: z.array(z.string().email()),
    studentEmail: z.string().email(),
});
export type SuggestDacMembersBody = z.infer<typeof suggestDacMembersSchema>;

export const submitExaminerSuggestionsSchema = z.object({
    suggestionRequestId: z.number(),
    subArea1Examiners: z.array(z.string().email()).min(1).max(4),
    subArea2Examiners: z.array(z.string().email()).min(1).max(4),
});
export type SubmitExaminerSuggestionsBody = z.infer<typeof submitExaminerSuggestionsSchema>;


//============================================
//== Notional Supervisor Schemas
//============================================
export const addPhdCourseSchema = z.object({
    studentEmail: z.string().email(),
    courses: z.array(z.object({
        courseId: z.string().nonempty(),
        name: z.string().nonempty(),
        units: z.coerce.number(),
    })).nonempty(),
});
export type AddPhdCourseBody = z.infer<typeof addPhdCourseSchema>;

export const deletePhdCourseSchema = z.object({
    studentEmail: z.string().email(),
    courseId: z.string(),
});
export type DeletePhdCourseBody = z.infer<typeof deletePhdCourseSchema>;

export const updatePhdGradeSchema = z.object({
    studentEmail: z.string().email(),
    courses: z.array(z.object({
        courseId: z.string(),
        grade: z.string().nullable(),
    })).nonempty(),
});
export type UpdatePhdGradeBody = z.infer<typeof updatePhdGradeSchema>;

export const updatePhdCoursesSchema = z.object({
    studentEmail: z.string().email(),
    courses: z.array(z.object({
        id: z.string(),
        name: z.string(),
        units: z.number(),
        grade: z.string().nullable(),
    })).min(0),
});
export type UpdatePhdCoursesBody = z.infer<typeof updatePhdCoursesSchema>;


//============================================
//== DRC Member Schemas
//============================================
export const rejectApplicationSchema = z.object({
    status: z.enum(['Rejected']),
    reason: z.string().min(1, "Rejection reason is required"),
});
export type RejectApplicationBody = z.infer<typeof rejectApplicationSchema>;

export const generateTimetableSchema = z.object({
    finalExaminers: z.record(z.string(), z.record(z.string(), z.string().email())),
});
export type GenerateTimetableBody = z.infer<typeof generateTimetableSchema>;

export const submitResultsSchema = z.object({
    results: z.array(z.object({
        applicationId: z.number(),
        subAreaId: z.number(),
        passed: z.boolean(),
        comments: z.string().optional(),
    })),
});
export type SubmitResultsBody = z.infer<typeof submitResultsSchema>;

export const suggestTwoBestDacSchema = z.object({
    email: z.string().email(),
    selectedDacMembers: z.array(z.string().email()),
});
export type SuggestTwoBestDacBody = z.infer<typeof suggestTwoBestDacSchema>;

export const updateFinalDacSchema = z.object({
    email: z.string().email(),
    finalDacMembers: z.array(z.string().email()).length(2),
});
export type UpdateFinalDacBody = z.infer<typeof updateFinalDacSchema>;

export const updateQualificationDatesSchema = z.array(z.object({
    email: z.string().email(),
    qualificationDate: z.string().datetime(),
}));
export type UpdateQualificationDatesBody = z.infer<typeof updateQualificationDatesSchema>;

export const courseworkFormSchema = z.array(z.object({
    name: z.string(),
    email: z.string().email(),
    courses: z.array(
      z.object({
        name: z.string(),
        units: z.number().nullable(),
        grade: z.string().nullable(),
      }),
    ),
}));
export type CourseworkFormData = z.infer<typeof courseworkFormSchema>;