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

export const updateApplicationStatusDRCSchema = z.object({
    status: z.enum(phdExamApplicationStatuses),
    comments: optionalString,
});

export const updateExamStatusSchema = z.array(
    z.object({
        email: z.string().email(),
        ifPass: z.boolean(),
    })
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

export const updateSubAreasSchema = z.object({
    subArea: z.string().min(1),
});

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
        .array(
            z.object({
                courseId: z.string(),
                grade: z.string().nullable(),
            })
        )
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

export interface QualifyingExamApplication {
    id: number;
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
        coSupervisor1: string | null;
        coSupervisor2: string | null;
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

export interface QualifyingExamApplicationsResponse {
    exam: {
        id: number;
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
