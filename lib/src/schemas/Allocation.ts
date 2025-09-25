import { z } from "zod";

export const sectionTypes = ["LECTURE", "TUTORIAL", "PRACTICAL"] as const;
export const degreeTypes = ["FD", "HD"] as const;
export const semesterTypes = ["1", "2", "3"] as const; // 3 is for summer term
export const courseTypes = ["CDC", "Elective"] as const;
export const allocationStatuses = [
    "notStarted",
    "ongoing",
    "completed",
    "suspended",
] as const;

export const sectionTypeEnum = z.enum(sectionTypes);
export const degreeTypeEnum = z.enum(degreeTypes);
export const semesterTypeEnum = z.enum(semesterTypes);
export const courseTypeEnum = z.enum(courseTypes);
export const allocationStatusEnum = z.enum(allocationStatuses);

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
});

export const semesterSchema = z.object({
    id: z.string().uuid().optional(),
    year: z.number().int(),
    semesterType: semesterTypeEnum,
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
    semesterId: z.string().uuid(),
});

export const courseAllocateSchema = z.object({
    semesterId: z.string().uuid(),
    courseCode: z.string().nonempty(),
    ic: z.string().email().nonempty(),
    sections: z.array(
        z.object({
            type: z.enum(sectionTypes),
            instructors: z.array(z.string().email().nonempty()),
        })
    ),
});

export const addSectionBodySchema = z.object({
    masterId: z.string().uuid(),
    sectionType: z.enum(sectionTypes),
});

export const removeSectionsBodySchema = z.object({
    sectionId: z.union([z.array(z.string().uuid()), z.string().uuid()]),
});

export const assignInstructorBodySchema = z.object({
    sectionId: z.string().uuid(),
    instructorEmail: z.string().email(),
});

export const dismissInstructorBodySchema = assignInstructorBodySchema;
