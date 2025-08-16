import { relations } from "drizzle-orm";
import { allocation } from "./allocation.ts";
import { course } from "./course.ts";
import { semester } from "./semester.ts";
import { users } from "./admin.ts";

export const allocationRelations = relations(allocation, ({ one }) => ({
    course: one(course, {
        fields: [allocation.courseId],
        references: [course.code]
    }),
    semester: one(semester, {
        fields: [allocation.semesterId],
        references: [semester.id]
    }),
    instructor: one(users, {
        fields: [allocation.instructorId],
        references: [users.email] // or users.email if no id
    })
}));
