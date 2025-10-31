import { relations } from "drizzle-orm";
import { fileFields, files, applications, applicationStatus } from "./form.ts";
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
            relationName: "applicationStatusUser",
        }),
        application: one(applications, {
            fields: [applicationStatus.applicationId],
            references: [applications.id],
            relationName: "applicationStatus",
        }),
    })
);

export const fileFieldsFormsRelations = relations(fileFields, ({ one }) => ({
    user: one(users, {
        fields: [fileFields.userEmail],
        references: [users.email],
        relationName: "fileFieldsUser",
    }),
    file: one(files, {
        fields: [fileFields.fileId],
        references: [files.id],
        relationName: "fileFieldsFile",
    }),
}));

export const filesFormsRelations = relations(files, ({ one, many }) => ({
    user: one(users, {
        fields: [files.userEmail],
        references: [users.email],
        relationName: "files",
    }),
    fileField: many(fileFields, {
        relationName: "fileFieldsFile",
    }),
}));
