import { relations } from "drizzle-orm";
import { allocation } from "./allocation.ts";
import { course } from "./allocation.ts";
import { semester } from "./allocation.ts";
import { coursePreferences } from "./allocation.ts";
import { users } from "./admin.ts";

export const coursePreferenceRelations = relations(coursePreferences, ({ one }) => ({
    instructor: one(users, {
        fields: [coursePreferences.courseCode], //fk
        references: [users.email] //pk
    }),
    semester: one(semester, {
        fields: [coursePreferences.semesterId],
        references: [semester.id]
    }),
    course: one(course, {
        fields: [coursePreferences.courseCode],
        references: [course.code]
    }),
}));

export const allocationRelations = relations(allocation, ({ one }) => ({
    course: one(course, {
        fields: [allocation.courseCode], //fk
        references: [course.code] //pk
    }),
    instructor: one(users, {
        fields: [allocation.instructorEmail],
        references: [users.email]
    }),
    semester: one(semester, {
        fields: [allocation.semesterId],
        references: [semester.id]
    }),
}));

export const semesterRelations = relations(semester, ({ one }) => ({
    convener: one(users, {
        fields: [semester.dcaAtStartOfSem], 
        references: [users.email] 
    }),
    members: one(users, {
        fields: [semester.dcaMembersAtStartOfSem], 
        references: [users.email] 
    }),
    hod: one(users, {
        fields: [semester.hodAtStartOfSem], 
        references: [users.email] 
    }),
}));
