import { relations } from "drizzle-orm";
import { phdApplications, phdCourses } from "./phd.ts";
import { phd } from "./admin.ts";

export const phdApplicationsRelations = relations(phdApplications, ({ one }) => ({
    phdUser: one(phd, {
        fields: [phdApplications.email],
        references: [phd.email],
        relationName: "phd",
    }),
}));

export const phdCoursesRelations = relations(phdCourses, ({ one }) => ({
    student: one(phd, {
        fields: [phdCourses.studentEmail],
        references: [phd.email],
        relationName: "studentCourses",
    }),
}));