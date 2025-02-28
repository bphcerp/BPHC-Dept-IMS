import { relations } from "drizzle-orm";
import {
    textFields,
    fileFields,
    textFieldStatus,
    fileFieldStatus,
    files,
    applications,
    applicationStatus,
    numberFields,
    numberFieldStatus,
    dateFields,
    dateFieldStatus,
} from "./form.ts";
import { users } from "./admin.ts";
import { conferenceApprovalApplications } from "./conference.ts";
import { courseHandoutRequests } from "./handout.ts";

export const applicationsFormsRelations = relations(
    applications,
    ({ one, many }) => ({
        user: one(users, {
            fields: [applications.userEmail],
            references: [users.email],
            relationName: "applications",
        }),
        statuses: many(applicationStatus, {
            relationName: "applicationStatus",
        }),
        conferenceApplications: many(conferenceApprovalApplications, {
            relationName: "conferenceApprovalApplications",
        }),
        courseHandoutRequests: many(courseHandoutRequests, {
            relationName: "courseHandoutRequests",
        }),
    })
);

export const applicationStatusFormsRelations = relations(
    applicationStatus,
    ({ one }) => ({
        user: one(users, {
            fields: [applicationStatus.userEmail],
            references: [users.email],
            relationName: "applicationStatusUser",
        }),
        application: one(applications, {
            fields: [applicationStatus.applicationId],
            references: [applications.id],
            relationName: "applicationStatus",
        }),
    })
);

export const textFieldsFormsRelations = relations(
    textFields,
    ({ one, many }) => ({
        user: one(users, {
            fields: [textFields.userEmail],
            references: [users.email],
            relationName: "textFieldsUser",
        }),
        statuses: many(textFieldStatus, {
            relationName: "textFields",
        }),
    })
);

export const numberFieldsFormsRelations = relations(
    numberFields,
    ({ one, many }) => ({
        user: one(users, {
            fields: [numberFields.userEmail],
            references: [users.email],
            relationName: "numberFieldsUser",
        }),
        statuses: many(numberFieldStatus, {
            relationName: "numberFields",
        }),
    })
);

export const dateFieldsFormsRelations = relations(
    dateFields,
    ({ one, many }) => ({
        user: one(users, {
            fields: [dateFields.userEmail],
            references: [users.email],
            relationName: "dateFieldsUser",
        }),
        statuses: many(dateFieldStatus, {
            relationName: "dateFields",
        }),
    })
);

export const fileFieldsFormsRelations = relations(
    fileFields,
    ({ one, many }) => ({
        user: one(users, {
            fields: [fileFields.userEmail],
            references: [users.email],
            relationName: "fileFieldsUser",
        }),
        statuses: many(fileFieldStatus, {
            relationName: "fileFields",
        }),
        file: one(files, {
            fields: [fileFields.file],
            references: [files.id],
            relationName: "fileFieldsFile",
        }),
    })
);

export const textFieldStatusFormsRelations = relations(
    textFieldStatus,
    ({ one }) => ({
        user: one(users, {
            fields: [textFieldStatus.userEmail],
            references: [users.email],
            relationName: "textFieldStatus",
        }),
        textField: one(textFields, {
            fields: [textFieldStatus.textField],
            references: [textFields.id],
            relationName: "textFields",
        }),
    })
);

export const numberFieldStatusFormsRelations = relations(
    numberFieldStatus,
    ({ one }) => ({
        user: one(users, {
            fields: [numberFieldStatus.userEmail],
            references: [users.email],
            relationName: "numberFieldStatus",
        }),
        numberField: one(numberFields, {
            fields: [numberFieldStatus.numberField],
            references: [numberFields.id],
            relationName: "numberFields",
        }),
    })
);

export const dateFieldStatusFormsRelations = relations(
    dateFieldStatus,
    ({ one }) => ({
        user: one(users, {
            fields: [dateFieldStatus.userEmail],
            references: [users.email],
            relationName: "dateFieldStatus",
        }),
        dateField: one(dateFields, {
            fields: [dateFieldStatus.dateField],
            references: [dateFields.id],
            relationName: "dateFields",
        }),
    })
);

export const fileFieldStatusFormsRelations = relations(
    fileFieldStatus,
    ({ one }) => ({
        user: one(users, {
            fields: [fileFieldStatus.userEmail],
            references: [users.email],
            relationName: "fileFieldStatus",
        }),
        fileField: one(fileFields, {
            fields: [fileFieldStatus.fileField],
            references: [fileFields.id],
            relationName: "fileFields",
        }),
    })
);

export const filesFormsRelations = relations(files, ({ one, many }) => ({
    user: one(users, {
        fields: [files.uploadedBy],
        references: [users.email],
        relationName: "files",
    }),
    fileField: many(fileFields, {
        relationName: "fileFieldsFile",
    }),
}));
