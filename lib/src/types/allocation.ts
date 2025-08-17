import type {
	allocationSelectSchema,
	allocationInsertSchema,
	courseSelectSchema,
	courseInsertSchema,
	coursePreferencesSelectSchema,
	coursePreferencesInsertSchema,
	semesterSelectSchema,
	semesterInsertSchema
} from "../schemas/Allocation.ts";

import type { z } from "zod";

export type Allocation = z.infer<typeof allocationSelectSchema>;
export type AllocationInsert = z.infer<typeof allocationInsertSchema>;

export type Course = z.infer<typeof courseSelectSchema>;
export type CourseInsert = z.infer<typeof courseInsertSchema>;

export type CoursePreferences = z.infer<typeof coursePreferencesSelectSchema>;
export type CoursePreferencesInsert = z.infer<typeof coursePreferencesInsertSchema>;

export type Semester = z.infer<typeof semesterSelectSchema>;
export type SemesterInsert = z.infer<typeof semesterInsertSchema>;
