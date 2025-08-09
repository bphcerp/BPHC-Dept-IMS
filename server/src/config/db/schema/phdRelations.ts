import { relations } from "drizzle-orm";
import { phdCourses, phdQualifyingExams, phdSemesters } from "./phd.ts";
import { phd } from "./admin.ts";

export const phdCoursesRelations = relations(phdCourses, ({ one }) => ({
    student: one(phd, {
        fields: [phdCourses.studentEmail],
        references: [phd.email],
        relationName: "studentCourses",
    }),
}));

export const phdQualifyingExamsRelations = relations(
    phdQualifyingExams,
    ({ one }) => ({
        semester: one(phdSemesters, {
            fields: [phdQualifyingExams.semesterId],
            references: [phdSemesters.id],
            relationName: "qualifyingExamsBySemester",
        }),
    })
);

export const phdSemestersRelations = relations(phdSemesters, ({ many }) => ({
    qualifyingExams: many(phdQualifyingExams, {
        relationName: "qualifyingExamsBySemester",
    }),
}));
