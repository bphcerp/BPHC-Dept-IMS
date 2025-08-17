
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
	allocation,
	course,
	coursePreferences,
	semester
} from "@server/config/db/schema/allocation.ts";

export const allocationSelectSchema = createSelectSchema(allocation);
export const allocationInsertSchema = createInsertSchema(allocation);

export const courseSelectSchema = createSelectSchema(course);
export const courseInsertSchema = createInsertSchema(course);

export const coursePreferencesSelectSchema = createSelectSchema(coursePreferences);
export const coursePreferencesInsertSchema = createInsertSchema(coursePreferences);

export const semesterSelectSchema = createSelectSchema(semester);
export const semesterInsertSchema = createInsertSchema(semester);
