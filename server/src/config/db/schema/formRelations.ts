import { relations } from "drizzle-orm";
import {
    textFields,
    fileFields,
    textFieldStatus,
    fileFieldStatus,
    files,
    applications,
    applicationStatus,
} from "./form.ts";
import { users } from "./admin.ts";

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
    })
);

export const applicationStatusFormsRelations = relations(
    applicationStatus,
    ({ one }) => ({
        user: one(users, {
            fields: [applicationStatus.userEmail],
            references: [users.email],
            relationName: "applicationStatus",
        }),
        application: one(applications, {
            fields: [applicationStatus.applicationId],
            references: [applications.id],
            relationName: "applicationStatus",
        }),
    })
);

export const textFieldsFormsRelations = relations(textFields, ({ many }) => ({
    textFields: many(textFieldStatus, {
        relationName: "textFields",
    }),
}));

export const fileFieldsFormsRelations = relations(
    fileFields,
    ({ one, many }) => ({
        statuses: many(fileFieldStatus, {
            relationName: "fileFields",
        }),
        file: one(files, {
            fields: [fileFields.file],
            references: [files.id],
            relationName: "fileFields",
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
        relationName: "fileFields",
    }),
}));
