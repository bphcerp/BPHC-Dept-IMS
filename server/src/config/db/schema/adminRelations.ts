import { relations } from "drizzle-orm";
import { refreshTokens, users, faculty, phd, staff } from "./admin.ts";
import {
    applications,
    applicationStatus,
    fileFieldStatus,
    files,
    textFieldStatus,
} from "./form.ts";
import { courseHandoutRequests } from "./handout.ts";

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
    applications: many(applications, {
        relationName: "applications",
    }),
    applicationStatus: many(applicationStatus, {
        relationName: "applicationStatus",
    }),
    textFieldStatus: one(textFieldStatus, {
        fields: [users.email],
        references: [textFieldStatus.userEmail],
        relationName: "textFieldStatus",
    }),
    fileFieldStatus: one(fileFieldStatus, {
        fields: [users.email],
        references: [fileFieldStatus.userEmail],
        relationName: "fileFieldStatus",
    }),
    files: many(files, {
        relationName: "files",
    }),
    courseHandoutRequests: many(courseHandoutRequests, {
        relationName: "handoutUserEmail",
    }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
    user: one(users, {
        fields: [refreshTokens.userEmail],
        references: [users.email],
        relationName: "user",
    }),
}));

export const facultyAdminRelations = relations(faculty, ({ one }) => ({
    user: one(users, {
        fields: [faculty.email],
        references: [users.email],
        relationName: "faculty",
    }),
}));

export const phdAdminRelations = relations(phd, ({ one }) => ({
    user: one(users, {
        fields: [phd.email],
        references: [users.email],
        relationName: "phd",
    }),
}));

export const staffAdminRelations = relations(staff, ({ one }) => ({
    user: one(users, {
        fields: [staff.email],
        references: [users.email],
        relationName: "staff",
    }),
}));
