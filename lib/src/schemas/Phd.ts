import z from "zod";


export const updateQualifyingExamStatusSchema = z.record(z.string(), z.enum(["pass", "fail"]));

export type UpdateQualifyingExamStatusBody = z.infer<typeof updateQualifyingExamStatusSchema>;

export const updateQualificationDateSchema = z.record(z.string(), z.string().datetime());

export type UpdateQualificationDateBody = z.infer<typeof updateQualificationDateSchema>;

export const suggestDacMembersSchema = z.object({
    dacMembers: z.array(z.string().email()).length(5, "Exactly 5 DAC members are required"),
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

export const    uploadApplicationSchema = z.object({
    fileUrl: z.string().url(),
    formName: z.string().min(1),
    applicationType: z.string().min(1),
    qualifyingArea1: z.string().min(1),
    qualifyingArea2: z.string().min(1),
});
export type uploadApplicationBody = z.infer<typeof uploadApplicationSchema>;

export const uploadProposalSchema = z.object({
    fileUrl1: z.string().url(),
    fileUrl2: z.string().url(),
    fileUrl3: z.string().url(),
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
    deadline: z.string().datetime()
});

export type UpdateQualifyingDeadlineBody = z.infer<typeof updateQualifyingDeadlineBodySchema>;
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
