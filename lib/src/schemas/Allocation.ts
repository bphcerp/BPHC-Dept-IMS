import { z } from "zod";

export const sectionTypeEnum = z.enum(["Lecture", "Tutorial", "Practical"]);
export const degreeTypeEnum = z.enum(["FD", "HD"]);
export const oddEvenEnum = z.enum(["odd", "even"]);
export const courseTypeEnum = z.enum(["CDC", "Elective"]);
export const allocationStatusEnum = z.enum([
    "notStarted",
    "ongoing",
    "completed",
    "suspended",
]);

// ------------------------ NOTE ------------------------
// The commented fields are automatically managed by the api and are not required in the schema.
// ------------------------------------------------------

export const allocationSchema = z.object({
    // id: z.string().uuid().optional(),
    instructorEmail: z.string().email(),
    semesterId: z.string().uuid(),
    courseCode: z.string(),
    sectionType: sectionTypeEnum,
    noOfSections: z.number().int().min(1),
});

export const updateAllocationSchema = allocationSchema.partial().extend({
    id: z.string().uuid(),
});

export const deleteAllocationSchema = z.object({
    id: z.string().uuid(),
});

export const courseSchema = z.object({
    code: z.string(),
    name: z.string(),
    lectureUnits: z.number().int().min(0),
    practicalUnits: z.number().int().min(0),
    offeredAs: courseTypeEnum,
    offeredTo: degreeTypeEnum,
    offeredAlsoBy: z.array(z.string()).optional(),
    totalUnits: z.number().int().min(1),
    // createdAt: z.date().optional(),
    // updatedAt: z.date().optional()
});

export const deleteCourseSchema = z.object({
    code: z.string(),
});

export const semesterFormLinkSchema = z.object({
    formId: z.string().uuid(),
})

export const semesterSchema = z.object({
    id: z.string().uuid().optional(),
    year: z.number().int(),
    oddEven: oddEvenEnum,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    noOfElectivesPerInstructor: z.number().int().min(0),
    noOfDisciplineCoursesPerInstructor: z.number().int().min(0),
    // hodAtStartOfSemEmail: z.string().email().optional(),
    // dcaConvenerAtStartOfSemEmail: z.string().email().optional(),
    allocationStatus: allocationStatusEnum,
    // createdAt: z.date().optional(),
    //updatedAt: z.date().optional()
});

export const updateSemesterSchema = semesterSchema.partial().extend({
    id: z.string().uuid(),
});

export const deleteSemesterSchema = z.object({
    id: z.string().uuid(),
});

export const allocationSectionSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: sectionTypeEnum,
    masterId: z.string().uuid(),
});

export const masterAllocationSchema = z.object({
    id: z.string().uuid(),
    semesterId: z.string().uuid(),
    ic: z.string().email(),
    courseCode: z.string(),
});

export const courseCodeSchema = z.object({
    code: z.string().nonempty(),
});

export const courseAllocateSchema = z.object({
    courseCode: z.string().nonempty(),
    ic: z.string().email().nonempty(),
    sections: z.array(
        z.object({
            number: z.coerce.number(),
            type: z.enum(["LECTURE", "TUTORIAL", "PRACTICAL"]),
            instructors: z.array(z.string().email().nonempty()),
        })
    ),
});
