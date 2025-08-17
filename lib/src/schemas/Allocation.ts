
import { z } from "zod";

export const sectionTypeEnum = z.enum(["Lecture", "Tutorial", "Practical"]);
export const allocationSchema = z.object({
	instructorEmail: z.string().email(),
	semesterId: z.number().int(),
	courseCode: z.string(),
	sectionType: sectionTypeEnum,
	noOfSections: z.number().int().min(1),
});
