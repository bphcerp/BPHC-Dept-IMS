import { relations } from "drizzle-orm";
import {
    phdCourses,
    phdQualifyingExams,
    phdSemesters,
    phdExamApplications,
    phdExaminerSuggestions,
    phdExaminerAssignments,
    phdProposals,
    phdProposalCoSupervisors,
    phdProposalDacMembers,
    phdExamTimetableSlots,
    phdProposalDacReviews,
    phdProposalSemesters,
    phdProposalDacReviewForms,
} from "./phd.ts";
import { faculty, phd } from "./admin.ts";
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
        timetableSlots: many(phdExamTimetableSlots, {
            relationName: "examTimetableSlots",
        }),
    })
);

export const phdSemestersRelations = relations(phdSemesters, ({ many }) => ({
    qualifyingExams: many(phdQualifyingExams, {
        relationName: "qualifyingExamsBySemester",
    }),
    proposalSemester: many(phdProposalSemesters, {
        relationName: "proposalDeadlinesBySemester",
    }),
}));

export const phdProposalSemestersRelations = relations(
    phdProposalSemesters,
    ({ one, many }) => ({
        semester: one(phdSemesters, {
            fields: [phdProposalSemesters.semesterId],
            references: [phdSemesters.id],
            relationName: "proposalDeadlinesBySemester",
        }),
        proposals: many(phdProposals, {
            relationName: "proposalSemester",
        }),
    })
);

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
            relationName: "phdQualifyingExamApplications",
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

export const phdProposalsRelations = relations(
    phdProposals,
    ({ one, many }) => ({
        student: one(phd, {
            fields: [phdProposals.studentEmail],
            references: [phd.email],
            relationName: "studentProposals",
        }),
        supervisor: one(faculty, {
            fields: [phdProposals.supervisorEmail],
            references: [faculty.email],
            relationName: "supervisorProposals",
        }),
        proposalSemester: one(phdProposalSemesters, {
            fields: [phdProposals.proposalSemesterId],
            references: [phdProposalSemesters.id],
            relationName: "proposalSemester",
        }),
        appendixFile: one(files, {
            fields: [phdProposals.appendixFileId],
            references: [files.id],
        }),
        summaryFile: one(files, {
            fields: [phdProposals.summaryFileId],
            references: [files.id],
        }),
        outlineFile: one(files, {
            fields: [phdProposals.outlineFileId],
            references: [files.id],
        }),
        placeOfResearchFile: one(files, {
            fields: [phdProposals.placeOfResearchFileId],
            references: [files.id],
        }),
        outsideCoSupervisorFormatFile: one(files, {
            fields: [phdProposals.outsideCoSupervisorFormatFileId],
            references: [files.id],
        }),
        outsideSupervisorBiodataFile: one(files, {
            fields: [phdProposals.outsideSupervisorBiodataFileId],
            references: [files.id],
        }),
        coSupervisors: many(phdProposalCoSupervisors, {
            relationName: "proposalCoSupervisors",
        }),
        dacMembers: many(phdProposalDacMembers, {
            relationName: "proposalDacMembers",
        }),
        dacReviews: many(phdProposalDacReviews, {
            relationName: "proposalDacReviews",
        }),
    })
);

export const phdProposalCoSupervisorsRelations = relations(
    phdProposalCoSupervisors,
    ({ one }) => ({
        proposal: one(phdProposals, {
            fields: [phdProposalCoSupervisors.proposalId],
            references: [phdProposals.id],
            relationName: "proposalCoSupervisors",
        }),
        coSupervisor: one(faculty, {
            fields: [phdProposalCoSupervisors.coSupervisorEmail],
            references: [faculty.email],
            relationName: "coSupervisorProposals",
        }),
    })
);

export const phdProposalDacMembersRelations = relations(
    phdProposalDacMembers,
    ({ one }) => ({
        proposal: one(phdProposals, {
            fields: [phdProposalDacMembers.proposalId],
            references: [phdProposals.id],
            relationName: "proposalDacMembers",
        }),
        dacMember: one(faculty, {
            fields: [phdProposalDacMembers.dacMemberEmail],
            references: [faculty.email],
            relationName: "dacMemberProposals",
        }),
    })
);

export const phdExamTimetableSlotsRelations = relations(
    phdExamTimetableSlots,
    ({ one }) => ({
        exam: one(phdQualifyingExams, {
            fields: [phdExamTimetableSlots.examId],
            references: [phdQualifyingExams.id],
            relationName: "examTimetableSlots",
        }),
        student: one(phd, {
            fields: [phdExamTimetableSlots.studentEmail],
            references: [phd.email],
            relationName: "studentTimetableSlots",
        }),
    })
);

export const phdProposalDacReviewsRelations = relations(
    phdProposalDacReviews,
    ({ one }) => ({
        proposal: one(phdProposals, {
            fields: [phdProposalDacReviews.proposalId],
            references: [phdProposals.id],
            relationName: "proposalDacReviews",
        }),
        dacMember: one(faculty, {
            fields: [phdProposalDacReviews.dacMemberEmail],
            references: [faculty.email],
            relationName: "dacMemberReviews",
        }),
        reviewForm: one(phdProposalDacReviewForms, {
            fields: [phdProposalDacReviews.id],
            references: [phdProposalDacReviewForms.reviewId],
            relationName: "dacReviewForm",
        }),
        feedbackFile: one(files, {
            fields: [phdProposalDacReviews.feedbackFileId],
            references: [files.id],
        }),
    })
);

export const phdProposalDacReviewFormsRelations = relations(
    phdProposalDacReviewForms,
    ({ one }) => ({
        review: one(phdProposalDacReviews, {
            fields: [phdProposalDacReviewForms.reviewId],
            references: [phdProposalDacReviews.id],
            relationName: "dacReviewForm",
        }),
    })
);
