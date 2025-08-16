import { relations } from "drizzle-orm";
import { coursePreferences } from "./coursePreferences.ts";
import { users } from "./admin.ts";
import { semester } from "./semester.ts";
import { course } from "./course.ts";

export const coursePreferencesRelations = relations(coursePreferences, ({ one }) => ({
    instructor: one(users, {
        fields: [coursePreferences.instructorId],
        references: [users.email]
    }),
    semester: one(semester, {
        fields: [coursePreferences.semesterId],
        references: [semester.id]
    }),
    course: one(course, {
        fields: [coursePreferences.courseId],
        references: [course.code]
    })
}));
