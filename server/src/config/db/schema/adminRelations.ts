import { relations } from "drizzle-orm";
import { refreshTokens, users, faculty, phd, staff } from "./admin.ts";
import { applications, applicationStatus, fileFields, files } from "./form.ts";
import { courseHandoutRequests } from "./handout.ts";
import { conferenceApprovalApplications } from "./conference.ts";
import {
    phdExamApplications,
    phdProposalCoSupervisors,
    phdProposalDacMembers,
    phdProposals,
} from "./phd.ts";
import { phdRequests } from "./phdRequest.ts";
import { allocationSectionInstructors } from "./allocation.ts";

export const usersRelations = relations(users, ({ many, one }) => ({
    refreshTokens: many(refreshTokens, { relationName: "user" }),
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
    applications: many(applications, { relationName: "applications" }),
    applicationStatuses: many(applicationStatus, {
        relationName: "applicationStatusUser",
    }),
    fileFields: many(fileFields, { relationName: "fileFieldsUser" }),
    files: many(files, {
        relationName: "files",
    }),
    ics: many(courseHandoutRequests, {
        relationName: "ic",
    }),
    reviewers: many(courseHandoutRequests, {
        relationName: "reviewer",
    }),
    courseAllocationSections: many(allocationSectionInstructors),
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
    coSupervisingProposals: many(phdProposalCoSupervisors, {
        relationName: "coSupervisorProposals",
    }),
    dacMemberProposals: many(phdProposalDacMembers, {
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
    proposals: many(phdProposals, { relationName: "studentProposals" }),
    requests: many(phdRequests, { relationName: "studentRequests" }),
    supervisor: one(faculty, {
        fields: [phd.supervisorEmail],
        references: [faculty.email],
        relationName: "phdSupervisor",
    }),
}));

export const staffAdminRelations = relations(staff, ({ one }) => ({
    user: one(users, {
        fields: [staff.email],
        references: [users.email],
        relationName: "staff",
    }),
}));
