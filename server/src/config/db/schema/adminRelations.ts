import { relations } from "drizzle-orm";
import { refreshTokens, users, faculty, phd, staff } from "./admin.ts";
import {
    applications,
    applicationStatus,
    dateFields,
    dateFieldStatus,
    fileFields,
    fileFieldStatus,
    files,
    numberFields,
    numberFieldStatus,
    textFields,
    textFieldStatus,
} from "./form.ts";
import { courseHandoutRequests } from "./handout.ts";
import { conferenceApprovalApplications } from "./conference.ts";
import { phdExamApplications, phdProposals } from "./phd.ts";

export const usersRelations = relations(users, ({ many, one }) => ({
    refreshTokens: many(refreshTokens, {
        relationName: "user",
    }),
    faculty: one(faculty, {
        fields: [users.email],
        references: [faculty.email],
        relationName: "faculty",
    }),
    phd: one(phd, {
        fields: [users.email],
        references: [phd.email],
        relationName: "phd",
    }),
    staff: one(staff, {
        fields: [users.email],
        references: [staff.email],
        relationName: "staff",
    }),
    conferenceAppliaction: many(conferenceApprovalApplications, {
        relationName: "conferenceApprovalApplicationUser",
    }),
    applications: many(applications, {
        relationName: "applications",
    }),
    applicationStatuses: many(applicationStatus, {
        relationName: "applicationStatusUser",
    }),
    textFields: many(textFields, {
        relationName: "textFieldsUser",
    }),
    numberFileds: many(numberFields, {
        relationName: "numberFieldsUser",
    }),
    dateFields: many(dateFields, {
        relationName: "dateFieldsUser",
    }),
    fileFields: many(fileFields, {
        relationName: "fileFieldsUser",
    }),
    textFieldStatuses: many(textFieldStatus, {
        relationName: "textFieldStatus",
    }),
    numberFieldStatuses: many(numberFieldStatus, {
        relationName: "numberFieldStatus",
    }),
    dateFieldStatuses: many(dateFieldStatus, {
        relationName: "dateFieldStatus",
    }),
    fileFieldStatuses: many(fileFieldStatus, {
        relationName: "fileFieldStatus",
    }),
    files: many(files, {
        relationName: "files",
    }),
    ics: many(courseHandoutRequests, {
        relationName: "ic",
    }),
    reviewers: many(courseHandoutRequests, {
        relationName: "reviewer",
    }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
    user: one(users, {
        fields: [refreshTokens.userEmail],
        references: [users.email],
        relationName: "user",
    }),
}));

export const facultyAdminRelations = relations(faculty, ({ one, many }) => ({
    user: one(users, {
        fields: [faculty.email],
        references: [users.email],
        relationName: "faculty",
    }),
    signatureFile: one(files, {
        fields: [faculty.signatureFileId],
        references: [files.id],
        relationName: "facultySignatureFile",
    }),
    supervisingProposals: many(phdProposals, {
        relationName: "supervisorProposals",
    }),
    coSupervisingProposals: many(phdProposals, {
        relationName: "coSupervisorProposals",
    }),
    dacMemberProposals: many(phdProposals, {
        relationName: "dacMemberProposals",
    }),
}));

export const phdAdminRelations = relations(phd, ({ one, many }) => ({
    user: one(users, {
        fields: [phd.email],
        references: [users.email],
        relationName: "phd",
    }),
    qeApplications: many(phdExamApplications, {
        relationName: "phdQualifyingExamApplications",
    }),
    proposals: many(phdProposals, {
        relationName: "studentProposals",
    }),
}));

export const staffAdminRelations = relations(staff, ({ one }) => ({
    user: one(users, {
        fields: [staff.email],
        references: [users.email],
        relationName: "staff",
    }),
}));
