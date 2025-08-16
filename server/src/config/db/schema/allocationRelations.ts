import { relations } from "drizzle-orm";
import { allocation } from "./allocation.ts";
import { course } from "./allocation.ts";
import { semester } from "./allocation.ts";
import { coursePreferences } from "./allocation.ts";
import { users } from "./admin.ts";

export const coursePreferenceRelations = relations(coursePreferences, ({ one }) => ({
    instructor: one(users, {
        fields: [coursePreferences.instructorId], //fk
        references: [users.email] //pk
    }),
    semester: one(semester, {
        fields: [coursePreferences.semesterId],
        references: [semester.id]
    }),
    course: one(course, {
        fields: [coursePreferences.courseId],
        references: [course.code]
    }),
}));

export const allocationRelations = relations(allocation, ({ one }) => ({
    course: one(course, {
        fields: [allocation.courseId], //fk
        references: [course.code] //pk
    }),
    instructor: one(users, {
        fields: [allocation.instructorId],
        references: [users.email]
    }),
    semester: one(semester, {
        fields: [allocation.semesterId],
        references: [semester.id]
    }),
}));
