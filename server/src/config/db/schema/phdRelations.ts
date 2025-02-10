import { relations } from "drizzle-orm";
import { phdApplications,courses, deadline } from "./phd.ts";
import { phd, faculty } from "./admin.ts";

export const phdApplicationsRelations = relations(phdApplications, ({ one }) => ({
    phdUser: one(phd, {
        fields: [phdApplications.email],
        references: [phd.email],
        relationName: "phd",
    }),
}));

export const coursesRelations = relations(courses, ({ one }) => ({
    student: one(phd, {
        fields: [courses.studentEmail],
        references: [phd.email],
        relationName: "studentCourses",
    }),
}));

export const deadlineRelations = relations(deadline, ({ one }) => ({
    facultyMember: one(faculty, {
        fields: [deadline.drcMember],
        references: [faculty.email],
        relationName: "facultyDeadlines",
    }),
}));