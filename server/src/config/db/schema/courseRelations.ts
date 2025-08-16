import { relations } from "drizzle-orm";
import { course } from "./course.ts";
import { coursePreferences } from "./coursePreferences.ts";
import { allocation } from "./allocation.ts";

export const courseRelations = relations(course, ({ many }) => ({
    preferences: many(coursePreferences),
    allocations: many(allocation)
}));