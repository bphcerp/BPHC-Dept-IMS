import { relations } from "drizzle-orm";
import {
    phdCourses,
    phdQualifyingExams,
    phdSemesters,
    phdExamApplications,
    phdExaminerSuggestions,
    phdExaminerAssignments,
} from "./phd.ts";
import { phd } from "./admin.ts";
import { files } from "./form.ts";

export const phdCoursesRelations = relations(phdCourses, ({ one }) => ({
    student: one(phd, {
        fields: [phdCourses.studentEmail],
        references: [phd.email],
        relationName: "studentCourses",
    }),
}));

export const phdQualifyingExamsRelations = relations(
    phdQualifyingExams,
    ({ one, many }) => ({
        semester: one(phdSemesters, {
            fields: [phdQualifyingExams.semesterId],
            references: [phdSemesters.id],
            relationName: "qualifyingExamsBySemester",
        }),
        applications: many(phdExamApplications, {
            relationName: "examApplications",
        }),
    })
);

export const phdSemestersRelations = relations(phdSemesters, ({ many }) => ({
    qualifyingExams: many(phdQualifyingExams, {
        relationName: "qualifyingExamsBySemester",
    }),
}));

export const phdExamApplicationsRelations = relations(
    phdExamApplications,
    ({ one, many }) => ({
        exam: one(phdQualifyingExams, {
            fields: [phdExamApplications.examId],
            references: [phdQualifyingExams.id],
            relationName: "examApplications",
        }),
        student: one(phd, {
            fields: [phdExamApplications.studentEmail],
            references: [phd.email],
            relationName: "studentApplications",
        }),
        examinerSuggestions: many(phdExaminerSuggestions, {
            relationName: "applicationSuggestions",
        }),
        examinerAssignments: many(phdExaminerAssignments, {
            relationName: "applicationAssignments",
        }),
        qualifyingArea1SyllabusFile: one(files, {
            fields: [phdExamApplications.qualifyingArea1SyllabusFileId],
            references: [files.id],
        }),
        qualifyingArea2SyllabusFile: one(files, {
            fields: [phdExamApplications.qualifyingArea2SyllabusFileId],
            references: [files.id],
        }),
        tenthReportFile: one(files, {
            fields: [phdExamApplications.tenthReportFileId],
            references: [files.id],
        }),
        twelfthReportFile: one(files, {
            fields: [phdExamApplications.twelfthReportFileId],
            references: [files.id],
        }),
        undergradReportFile: one(files, {
            fields: [phdExamApplications.undergradReportFileId],
            references: [files.id],
        }),
        mastersReportFile: one(files, {
            fields: [phdExamApplications.mastersReportFileId],
            references: [files.id],
        }),
    })
);

export const phdExaminerSuggestionsRelations = relations(
    phdExaminerSuggestions,
    ({ one }) => ({
        application: one(phdExamApplications, {
            fields: [phdExaminerSuggestions.applicationId],
            references: [phdExamApplications.id],
            relationName: "applicationSuggestions",
        }),
    })
);

export const phdExaminerAssignmentsRelations = relations(
    phdExaminerAssignments,
    ({ one }) => ({
        application: one(phdExamApplications, {
            fields: [phdExaminerAssignments.applicationId],
            references: [phdExamApplications.id],
            relationName: "applicationAssignments",
        }),
    })
);

export const phdStudentRelations = relations(phd, ({ many }) => ({
    applications: many(phdExamApplications, {
        relationName: "studentApplications",
    }),
}));
