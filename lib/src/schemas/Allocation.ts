import { z } from "zod";
import { userTypes } from "./Admin.ts";

export const sectionTypes = ["LECTURE", "TUTORIAL", "PRACTICAL"] as const;
export const degreeTypes = ["FD", "HD", "PhD"] as const;
export const semesterTypes = ["1", "2", "3"] as const; // 3 is for summer term
export const courseTypes = ["CDC", "DEL", "HEL"] as const;
export const allocationStatuses = [
    "notStarted",
    "formCollection",
    "inAllocation",
    "completed",
] as const;

export const sectionTypeEnum = z.enum(sectionTypes);
export const degreeTypeEnum = z.enum(degreeTypes);
export const semesterTypeEnum = z.enum(semesterTypes);
export const courseTypeEnum = z.enum(courseTypes);
export const allocationStatusEnum = z.enum(allocationStatuses);

export const courseTypeMap: Record<string, (typeof courseTypes)[number]> = {
    C: "CDC",
    D: "DEL",
    H: "HEL",
};

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
    markedForAllocation: z.boolean(),
    timetableCourseId: z.number().optional(),
});

export const courseMarkSchema = z.object({
    courseCodes: z.string().nonempty().array(),
});

export const courseGetQuerySchema = z.object({
    unmarked: z.coerce.boolean(),
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
    timetableRoomId: z.string().optional(),
});

export const masterAllocationSchema = z.object({
    id: z.string().uuid(),
    semesterId: z.string().uuid(),
    ic: z.string().email(),
    courseCode: z.string(),
});

export const courseCodeSchema = z.object({
    code: z.string().nonempty(),
    semesterId: z.string().uuid().optional(),
});

export const getPreferenceSchema = z.object({
    code: z.string().nonempty(),
    sectionType: sectionTypeEnum.optional(),
    userType: z.enum(userTypes).optional()
});

export const courseAllocateSchema = z.object({
    semesterId: z.string().uuid().optional(),
    courseCode: z.string().nonempty(),
    ic: z.string().email().optional(),
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

export const setSectionRoomBodySchema = z.object({
    sectionId: z.string().uuid(),
    roomId: z.string()
})

export const assignInstructorBodySchema = z.object({
    sectionId: z.string().uuid(),
    instructorEmail: z.string().email(),
});

export const dismissInstructorBodySchema = assignInstructorBodySchema;

export const getLatestSemesterQuerySchema = z.object({
    minimal: z.coerce.boolean().optional(),
    stats: z.coerce.boolean().optional(),
});

export const getInstructorDetailsQuerySchema = z.object({
    email: z.string().email(),
});

export const courseGroupSchema = z.object({
    // id: z.string().uuid(),
    name: z.string().nonempty(),
    description: z.string().nonempty(),
});

export const courseGroupCourseAddSchema = z.object({
    courseCodes: z.string().nonempty().array(),
    removedCourseCodes: z.string().nonempty().array().optional(),
});

export const courseGroupInsertQueryParamSchema = z.object({
    courses: z.coerce.boolean().optional(),
});

export const bulkModifyChangeSchema = z.object({
  sectionId: z.string().uuid(),
  oldInstructorEmail: z.string().email().nullable(),
  newInstructorEmail: z.string().email(),
  courseCode: z.string(),
  sectionType: z.enum(sectionTypes),
  sectionNumber: z.number().int(),
  oldInstructorName: z.string().nullable(),
  newInstructorName: z.string().nullable(),
  courseName: z.string().nullable(),
});

export const bulkModifySchema = z.array(bulkModifyChangeSchema);

export const pushToTDSchema = z.object({
    sendMultiDepartmentCourses: z.boolean(),
    idToken: z.string()
})
