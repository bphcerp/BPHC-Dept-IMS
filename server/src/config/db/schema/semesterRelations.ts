import { relations } from "drizzle-orm";
import { semester } from "./semester.ts";
import { coursePreferences } from "./coursePreferences.ts";
import { allocation } from "./allocation.ts";

export const semesterRelations = relations(semester, ({ many }) => ({
    coursePreferences: many(coursePreferences),
    allocations: many(allocation)
}));
