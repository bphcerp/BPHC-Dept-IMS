
import { z } from "zod";

export const sectionTypeEnum = z.enum(["Lecture", "Tutorial", "Practical"]);
export const oddEvenEnum = z.enum(["odd", "even"]);
export const allocationStatusEnum = z.enum(["notStarted", "ongoing", "completed", "suspended"]);

// ------------------------ NOTE ------------------------
// The commented fields are automatically managed by the api and are not required in the schema.
// ------------------------------------------------------

export const allocationSchema = z.object({
	instructorEmail: z.string().email(),
	semesterId: z.string().uuid(),
	courseCode: z.string(),
	sectionType: sectionTypeEnum,
	noOfSections: z.number().int().min(1),
});

export const courseSchema = z.object({
	code: z.string(),
	name: z.string(),
	lectureSecCount: z.number().int().min(0),
	tutSecCount: z.number().int().min(0),
	practicalSecCount: z.number().int().min(0),
	units: z.number().int().min(1),
	isCDC: z.boolean(),
	// createdAt: z.string().datetime().optional(),
	// updatedAt: z.string().datetime().optional()
}).refine(
	(data) =>
		(data.lectureSecCount ?? 0) > 0 ||
		(data.tutSecCount ?? 0) > 0 ||
		(data.practicalSecCount ?? 0) > 0,
	{
		message: "A course should have atleast one section of any type (Lecture, Tutorial, Practical)."
	}
);

export const coursePreferencesSchema = z.object({
	id: z.string().uuid().optional(),
	instructorEmail: z.string().email(),
	semesterId: z.string().uuid(),
	courseCode: z.string(),
	sectionType: sectionTypeEnum,
	preferences: z.number().int().min(1),
	// createdAt: z.string().datetime().optional(),
	// updatedAt: z.string().datetime().optional()
});

export const semesterSchema = z.object({
	id: z.string().uuid().optional(),
	year: z.number().int(),
	oddEven: oddEvenEnum,
	startDate: z.string().datetime(),
	endDate: z.string().datetime(),
	allocationDeadline: z.string().datetime().optional(),
	noOfElectivesPerInstructor: z.number().int(),
	noOfDisciplineCoursesPerInstructor: z.number().int(),
	// hodAtStartOfSemEmail: z.string().email().optional(),
	// dcaConvenerAtStartOfSemEmail: z.string().email().optional(),
	allocationSchema: allocationStatusEnum,
	// createdAt: z.string().datetime().optional(),
	// updatedAt: z.string().datetime().optional()
});