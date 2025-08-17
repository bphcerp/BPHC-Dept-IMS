
import { z } from "zod";

export const sectionTypeEnum = z.enum(["Lecture", "Tutorial", "Practical"]);
export const oddEvenEnum = z.enum(["odd", "even"]);
export const allocationStatusEnum = z.enum(["notStarted", "ongoing", "completed", "suspended"]);

export const allocationSchema = z.object({
	instructorEmail: z.string().email(),
	semesterId: z.number().int(),
	courseCode: z.string(),
	sectionType: sectionTypeEnum,
	noOfSections: z.number().int().min(1),
});

export const courseSchema = z.object({
	code: z.string(),
	name: z.string(),
	lectureSecCount: z.number().int().min(1),
	tutSecCount: z.number().int().min(1),
	practicalSecCount: z.number().int().min(1),
	units: z.number().int(),
	isCDC: z.boolean(),
	createdAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional()
	
});

export const coursePreferencesSchema = z.object({
	id: z.number().int().positive().optional(),
	instructorEmail: z.string().email(),
	semesterId: z.number().int(),
	courseCode: z.string(),
	sectionType: sectionTypeEnum,
	preferences: z.number().int().min(1),
	createdAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional()

});

export const semesterSchema = z.object({
	id: z.number().int().positive().optional(),
	year: z.number().int(),
	oddEven: oddEvenEnum,
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	allocationDeadline: z.string().datetime().optional(),
	noOfElectivesPerInstructor: z.number().int(),
	noOfDisciplineCoursesPerInstructor: z.number().int(),
	hodAtStartOfSem: z.string().email(),
	dcaAtStartOfSem: z.string().email(),
	dcaMembersAtStartOfSem: z.string().email(),
	allocationSchema: allocationStatusEnum,
	createdAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional()


});