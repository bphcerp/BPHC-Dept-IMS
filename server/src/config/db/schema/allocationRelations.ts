import { relations } from "drizzle-orm";
import { allocation } from "./allocation.ts";
import { course } from "./allocation.ts";
import { semester } from "./allocation.ts";
import { users } from "./admin.ts";
import { masterAllocation, allocationSection } from "./allocation.ts";

export const allocationRelations = relations(allocation, ({ one }) => ({
    course: one(course, {
        fields: [allocation.courseCode],
        references: [course.code],
    }),
    instructor: one(users, {
        fields: [allocation.instructorEmail],
        references: [users.email],
    }),
    semester: one(semester, {
        fields: [allocation.semesterId],
        references: [semester.id],
    }),
}));

export const semesterRelations = relations(semester, ({ one }) => ({
    dcaConvenerAtStartOfSem: one(users, {
        fields: [semester.dcaConvenerAtStartOfSemEmail],
        references: [users.email],
    }),
    hodAtStartOfSem: one(users, {
        fields: [semester.hodAtStartOfSemEmail],
        references: [users.email],
    }),
}));

export const masterAllocationRelations = relations(
    masterAllocation,
    ({ one, many }) => ({
        ic: one(users, {
            fields: [masterAllocation.ic],
            references: [users.email],
        }),
        course: one(course, {
            fields: [masterAllocation.courseCode],
            references: [course.code],
        }),
        lecture: many(allocationSection),
        tutorial: many(allocationSection),
        practical: many(allocationSection),
    })
);

export const sectionRelations = relations(allocationSection, ({ many }) => ({
    instructorEmails: many(users),
}));
