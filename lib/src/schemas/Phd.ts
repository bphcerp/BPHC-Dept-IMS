import z from "zod";
const optionalString = z
    .string()
    .trim()
    .nullish()
    .transform((val) => (val?.length ? val : null));
export const phdExamApplicationStatuses = [
    "applied",
    "verified",
    "resubmit",
] as const;
export const phdProposalStatuses = [
    "deleted",
    "supervisor_review",
    "cosupervisor_review",
    "drc_review",
    "dac_review",
    "dac_rejected",
    "completed",
] as const;

export const inactivePhdProposalStatuses: (typeof phdProposalStatuses)[number][] =
    ["completed", "deleted", "dac_rejected"];
export const resultStatusEnum = z.enum(["pass", "fail"]);
export const notifyDeadlinePayloadSchema = z.object({
    subject: z.string().min(1, "Subject is required for emails."),
    body: z.string().min(1, "Body cannot be empty."),
});
export type NotifyDeadlinePayload = z.infer<typeof notifyDeadlinePayloadSchema>;
export const singleNotificationPayloadSchema = z.object({
    subject: z.string().min(1, "Subject is required for emails."),
    body: z.string().min(1, "Body cannot be empty."),
    recipient: z.string().email("Valid email is required."),
});
export type SingleNotificationPayload = z.infer<
    typeof singleNotificationPayloadSchema
>;
export const notifyExaminerPayloadSchema = z.object({
    area: z.string().min(1, "Area is required."),
    subject: z.string().min(1, "Subject is required for emails."),
    body: z.string().min(1, "Body cannot be empty."),
});
export type NotifyExaminerPayload = z.infer<typeof notifyExaminerPayloadSchema>;
export const submitResultSchema = z.object({
    applicationId: z.number().int().positive(),
    result: resultStatusEnum,
});
export type SubmitResultBody = z.infer<typeof submitResultSchema>;
export const setQualificationDateSchema = z.object({
    studentEmail: z.string().email(),
    qualificationDate: z.string().datetime(),
});
export type SetQualificationDateBody = z.infer<
    typeof setQualificationDateSchema
>;
export const updateApplicationStatusDRCSchema = z.object({
    status: z.enum(phdExamApplicationStatuses),
    comments: optionalString,
});
export const createSuggestExaminersSchema = (examinerCount: number) =>
    z.object({
        suggestionsArea1: z
            .array(z.string().email())
            .length(
                examinerCount,
                `Must suggest exactly ${examinerCount}examiners`
            ),
        suggestionsArea2: z
            .array(z.string().email())
            .length(
                examinerCount,
                `Must suggest exactly ${examinerCount}examiners`
            ),
    });
export const updateExaminerCountSchema = z.object({
    examId: z.number().int().positive(),
    examinerCount: z.number().int().min(2).max(4),
});
export type UpdateExaminerCountBody = z.infer<typeof updateExaminerCountSchema>;
export const assignExaminersSchema = z.object({
    applicationId: z.number().int().positive(),
    examinerArea1: z.string().email(),
    examinerArea2: z.string().email(),
});
export type AssignExaminersBody = z.infer<typeof assignExaminersSchema>;
export const updateExamStatusSchema = z.array(
    z.object({ email: z.string().email(), ifPass: z.boolean() })
);
export type UpdateExamStatusSchemaBody = z.infer<typeof updateExamStatusSchema>;
export const updatePhdExamStatusSchema = z.object({
    email: z.string().email(),
    examNumber: z.number().int().min(1).max(2),
    status: z.enum(["pass", "fail"]),
    date: z.string().optional(),
});
export type UpdatePhdExamStatusBody = z.infer<typeof updatePhdExamStatusSchema>;
export const updateQualifyingExamStatusSchema = z.record(
    z.string(),
    z.enum(["pass", "fail"])
);
export type UpdateQualifyingExamStatusBody = z.infer<
    typeof updateQualifyingExamStatusSchema
>;
export const updateProposalDeadlineSchema = z.object({
    semesterId: z.number().int().positive(),
    deadline: z.string().datetime(),
});
export type UpdateProposalDeadlineBody = z.infer<
    typeof updateProposalDeadlineSchema
>;
export const updateQualifyingExamSchema = z
    .object({
        semesterId: z.number().int().positive(),
        examName: z.string().min(1),
        examStartDate: z.string().datetime(),
        examEndDate: z.string().datetime(),
        submissionDeadline: z.string().datetime(),
        vivaDate: z.string().datetime(),
    })
    .refine(
        (data) => {
            const startDate = new Date(data.examStartDate);
            const endDate = new Date(data.examEndDate);
            const submissionDeadline = new Date(data.submissionDeadline);
            const vivaDate = new Date(data.vivaDate);
            return (
                startDate < endDate &&
                submissionDeadline < startDate &&
                endDate < vivaDate
            );
        },
        { message: "Invalid dates" }
    );
export type UpdateQualifyingExamBody = z.infer<
    typeof updateQualifyingExamSchema
>;
export const updateSubAreasSchema = z.object({ subArea: z.string().min(1) });
export type UpdateSubAreasBody = z.infer<typeof updateSubAreasSchema>;
export const updateSemesterDatesSchema = z.object({
    year: z.string(),
    semesterNumber: z.number(),
    startDate: z.string(),
    endDate: z.string(),
});
export type UpdateSemesterDatesBody = z.infer<typeof updateSemesterDatesSchema>;
export const updateQualificationDateSchema = z.array(
    z.object({
        email: z.string().email(),
        qualificationDate: z.string().datetime(),
    })
);
export type UpdateQualificationDateBody = z.infer<
    typeof updateQualificationDateSchema
>;
export const suggestDacMembersSchema = z.object({
    dacMembers: z.array(z.string().email()),
    studentEmail: z.string().email(),
});
export type SuggestDacMembersBody = z.infer<typeof suggestDacMembersSchema>;
export const selectDacSchema = z.object({
    email: z.string().email(),
    selectedDacMembers: z.array(z.string().email()).length(2),
});
export type SelectDacBody = z.infer<typeof selectDacSchema>;
export const updateFinalDacSchema = z.object({
    email: z.string().email(),
    finalDacMembers: z.array(z.string().email()).length(2),
});
export type UpdateFinalDacBody = z.infer<typeof updateFinalDacSchema>;
export const qualifyingExamApplicationSchema = z.object({
    applicationId: z.coerce.number().int().positive().optional(),
    examId: z.coerce.number().int().positive(),
    qualifyingArea1: z.string().min(1),
    qualifyingArea2: z.string().min(1),
});
export type QualifyingExamApplicationBody = z.infer<
    typeof qualifyingExamApplicationSchema
>;
export const fileFieldNames = [
    "qualifyingArea1Syllabus",
    "qualifyingArea2Syllabus",
    "tenthReport",
    "twelfthReport",
    "undergradReport",
    "mastersReport",
] as const;
export const multerFileFields: Readonly<{ name: string; maxCount: number }[]> =
    (fileFieldNames as Readonly<string[]>).map((x) => {
        return { name: x, maxCount: 1 };
    });
export type FileField = (typeof fileFieldNames)[number];
export const uploadProposalSchema = z.object({
    fileUrl1: z.string(),
    fileUrl2: z.string(),
    fileUrl3: z.string(),
    formName1: z.string().min(1),
    formName2: z.string().min(1),
    formName3: z.string().min(1),
    supervisor: z.string().email(),
    coSupervisor1: z.string().email(),
    coSupervisor2: z.string().email(),
});
export type uploadProposalBody = z.infer<typeof uploadProposalSchema>;
export const updatePhdGradeBodySchema = z.object({
    studentEmail: z.string(),
    courses: z
        .array(z.object({ courseId: z.string(), grade: z.string().nullable() }))
        .nonempty(),
});
export type UpdatePhdGradeBody = z.infer<typeof updatePhdGradeBodySchema>;
export const updatePhdCoursesBodySchema = z.object({
    studentEmail: z.string(),
    courses: z
        .array(
            z.object({
                id: z.string(),
                name: z.string(),
                units: z.number(),
                grade: z.string().nullable(),
            })
        )
        .min(0),
});
export type UpdatePhdCoursesBody = z.infer<typeof updatePhdCoursesBodySchema>;
export const getQualifyingExamFormParamsSchema = z.object({
    email: z.string().email(),
});
export type GetQualifyingExamFormParams = z.infer<
    typeof getQualifyingExamFormParamsSchema
>;
export const updateQualifyingDeadlineBodySchema = z.object({
    deadline: z.string().datetime(),
});
export type UpdateQualifyingDeadlineBody = z.infer<
    typeof updateQualifyingDeadlineBodySchema
>;
export const courseworkFormSchema = z.array(
    z.object({
        name: z.string(),
        email: z.string().email(),
        courses: z.array(
            z.object({
                name: z.string(),
                units: z.number().nullable(),
                grade: z.string().nullable(),
            })
        ),
    })
);
export const addPhdCourseBodySchema = z.object({
    studentEmail: z.string(),
    courses: z
        .array(
            z.object({
                courseId: z.string(),
                name: z.string(),
                units: z.number(),
            })
        )
        .nonempty(),
});
export type AddPhdCourseBody = z.infer<typeof addPhdCourseBodySchema>;
export type CourseworkFormData = z.infer<typeof courseworkFormSchema>;
export const deletePhdCourseBodySchema = z.object({
    studentEmail: z.string(),
    courseId: z.string(),
});
export type DeletePhdCourseBody = z.infer<typeof deletePhdCourseBodySchema>;
export const updateExamDeadlineBodySchema = z.object({
    deadline: z.string().datetime(),
});
export type UpdateExamDeadlineBody = z.infer<
    typeof updateExamDeadlineBodySchema
>;
export const requestExaminerSuggestionsBodySchema = z.object({
    applicationId: z.number().int().positive(),
    subject: z.string().min(1, "Subject is required for emails."),
    body: z.string().min(1, "Body cannot be empty."),
});
export type requestExaminerSuggestionsBody = z.infer<
    typeof requestExaminerSuggestionsBodySchema
>;
export const updateEmailTemplateSchema = z.object({
    name: z.string().min(1),
    subject: z.string().min(1),
    body: z.string().min(1),
});
export type UpdateEmailTemplateBody = z.infer<typeof updateEmailTemplateSchema>;
export const phdProposalSubmissionSchema = z.object({
    title: z.string().min(1, "Title is required"),
});
export const phdProposalFileFieldNames = [
    "abstractFile",
    "proposalFile",
] as const;
export const phdProposalMulterFileFields: Readonly<
    { name: string; maxCount: number }[]
> = (phdProposalFileFieldNames as Readonly<string[]>).map((x) => {
    return { name: x, maxCount: 1 };
});
export const updateProposalStatusSchema = z.object({
    status: z.enum(phdProposalStatuses),
    comments: z.string().optional(),
});
export const editCoSupervisorsBodySchema = z
    .object({
        add: z.string().trim().nonempty().email().optional(),
        remove: z.string().trim().nonempty().email().optional(),
    })
    .refine(
        (data) => !!data.add !== !!data.remove,
        "Specify either add or remove"
    );
export type EditCoSupervisorsBody = z.infer<typeof editCoSupervisorsBodySchema>;
export const editDacMembersBodySchema = editCoSupervisorsBodySchema;
export type EditDacMembersBody = z.infer<typeof editDacMembersBodySchema>;
export const coSupervisorApprovalSchema = z.object({
    approvalStatus: z.boolean(),
    comments: z.string().optional(),
});
export const dacEvaluationSchema = z.object({
    status: z.enum(["completed", "discarded"]),
    comments: z.string().optional(),
});
export const finalizeDacMembersDrcSchema = z.object({
    finalizedDacMembers: z
        .array(z.string().email())
        .length(2, "You must select exactly 2 DAC members"),
});
export type FinalizeDacMembersDrcBody = z.infer<
    typeof finalizeDacMembersDrcSchema
>;
export const submitDacReviewSchema = z.object({
    approved: z.preprocess(
        (val) => val === "true" || val === true,
        z.boolean()
    ),
    comments: z.string().trim().min(1, "Comments are required for DAC review"),
});
export type SubmitDacReviewBody = z.infer<typeof submitDacReviewSchema>;
export interface PhdStudent {
    email: string;
    name: string | null;
    erpId: string | null;
    phone: string | null;
    supervisor: string | null;
    idNumber: string | null;
    coSupervisor1: string | null;
    coSupervisor2: string | null;
}
export interface QualifyingExamApplication {
    id: number;
    examId: number;
    status: (typeof phdExamApplicationStatuses)[number];
    comments: string | null;
    qualifyingArea1: string;
    qualifyingArea2: string;
    createdAt: string;
    updatedAt: string;
    student: {
        email: string;
        name: string | null;
        erpId: string | null;
        phone: string | null;
        supervisor: string | null;
        idNumber: string | null;
    };
    files: {
        qualifyingArea1Syllabus: string | null;
        qualifyingArea2Syllabus: string | null;
        tenthReport: string | null;
        twelfthReport: string | null;
        undergradReport: string | null;
        mastersReport: string | null;
    };
}
export interface VerifiedApplication {
    id: number;
    examId: number;
    qualifyingArea1: string;
    qualifyingArea2: string;
    createdAt: string;
    updatedAt: string;
    student: {
        email: string;
        name: string | null;
        erpId: string | null;
        phone: string | null;
        supervisor: string | null;
        idNumber: string | null;
    };
    examinerSuggestions: Record<string, string[]>;
    examinerAssignments: Record<
        string,
        {
            examinerEmail: string;
            notifiedAt: string | null;
            qpSubmitted: boolean;
        }
    >;
    result: "pass" | "fail" | null;
    qualificationDate: string | null;
    supervisorTodoExists: boolean;
}
export interface QualifyingExamApplicationsResponse {
    exam: {
        id: number;
        examinerCount: number;
        semesterId: number;
        examName: string;
        examStartDate: string;
        examEndDate: string;
        submissionDeadline: string;
        vivaDate: string | null;
        createdAt: string;
        updatedAt: string;
        semester: {
            id: number;
            year: string;
            semesterNumber: number;
            startDate: string;
            endDate: string;
            createdAt: string;
            updatedAt: string;
        };
    };
    applications: Array<QualifyingExamApplication>;
}
const timetableSlotItemSchema = z.object({
    id: z.number(),
    examId: z.number(),
    studentEmail: z.string(),
    qualifyingArea: z.string(),
    examinerEmail: z.string(),
    slotNumber: z.number(),
    student: z.object({ name: z.string().nullable() }),
});
export type TimetableSlotItem = z.infer<typeof timetableSlotItemSchema>;
const timetableUpdateSlotItemSchema = timetableSlotItemSchema.omit({
    id: true,
    student: true,
});
export const timetableSchema = z.object({
    slot1: z.array(timetableSlotItemSchema),
    slot2: z.array(timetableSlotItemSchema),
    unscheduled: z.array(timetableSlotItemSchema),
});
export type Timetable = z.infer<typeof timetableSchema>;
export const updateTimetableSchema = z.object({
    timetable: z.object({
        slot1: z.array(timetableUpdateSlotItemSchema),
        slot2: z.array(timetableUpdateSlotItemSchema),
        unscheduled: z.array(timetableUpdateSlotItemSchema),
    }),
});
export type UpdateTimetableBody = z.infer<typeof updateTimetableSchema>;
export const sendToDacSchema = z.object({
    acceptedDacMembers: z
        .array(z.string().email())
        .min(2, "At least 2 DAC members must be selected"),
});
export type SendToDacBody = z.infer<typeof sendToDacSchema>;
