
import { z } from "zod";

export const sectionTypeEnum = z.enum(["Lecture", "Tutorial", "Practical"]);
export const oddEvenEnum = z.enum(["odd", "even"]);
export const allocationStatusEnum = z.enum(["notStarted", "ongoing", "completed", "suspended"]);

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

export const updateAllocationSchema = 
allocationSchema.partial().extend({
	id: z.string().uuid()
});

export const deleteAllocationSchema = z.object({
    id: z.string().uuid() 
});

export const courseSchema = z.object({
	code: z.string(),
	name: z.string(),
	lectureSecCount: z.number().int().min(0),
	tutSecCount: z.number().int().min(0),
	practicalSecCount: z.number().int().min(0),
	hasLongPracticalSec: z.boolean().optional(),
	units: z.number().int().min(1),
	isCDC: z.boolean(),
	// createdAt: z.date().optional(),
	// updatedAt: z.date().optional()
}).refine(
	(data) =>
		(data.lectureSecCount ?? 0) > 0 ||
		(data.tutSecCount ?? 0) > 0 ||
		(data.practicalSecCount ?? 0) > 0,
	{
		message: "A course should have atleast one section of any type (Lecture, Tutorial, Practical)."
	}
);

export const deleteCourseSchema = z.object({
    code: z.string()
});

export const semesterSchema = z.object({
	id: z.string().uuid().optional(),
	year: z.number().int(),
	oddEven: oddEvenEnum,
	startDate: z.date(),
	endDate: z.date(),
	allocationDeadline: z.date().optional(),
	noOfElectivesPerInstructor: z.number().int(),
	noOfDisciplineCoursesPerInstructor: z.number().int(),
	// hodAtStartOfSemEmail: z.string().email().optional(),
	// dcaConvenerAtStartOfSemEmail: z.string().email().optional(),
	allocationSchema: allocationStatusEnum,
	// createdAt: z.date().optional(),
	//updatedAt: z.date().optional()
});

export const updateSemesterSchema = semesterSchema.partial().extend({
	id: z.string().uuid()
});

export const deleteSemesterSchema = z.object({
    id: z.string().uuid() 
});