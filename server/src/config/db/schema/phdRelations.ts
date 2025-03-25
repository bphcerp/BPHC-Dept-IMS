import { relations } from "drizzle-orm";
import {  phdCourses } from "./phd.ts";
import { phd } from "./admin.ts";

export const phdCoursesRelations = relations(phdCourses, ({ one }) => ({
    student: one(phd, {
        fields: [phdCourses.studentEmail],
        references: [phd.email],
        relationName: "studentCourses",
    }),
}));