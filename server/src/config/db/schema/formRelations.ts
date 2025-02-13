import { relations } from "drizzle-orm";
import { textFields, fileFields, textFieldStatus, fileFieldStatus,files } from "./form.ts";
import { users } from "./admin.ts";


export const usersRelations = relations(users, ({ many, one }) => ({
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
}))

export const textFieldsRelations = relations(textFields, ({ many }) => ({
    textFields: many(textFieldStatus, {
        relationName: "textFields",
    }),
}))

export const fileFieldsRelations = relations(fileFields, ({ many }) => ({
    fileFields: many(fileFieldStatus, {
        relationName: "fileFields",
    }),
}))

export const textFieldStatusRelations = relations(textFieldStatus, ({ one }) => ({
    textFieldStatus: one(users, {
        fields: [textFieldStatus.userEmail],
        references: [users.email],
        relationName: "textFieldStatus",
    }),
    textFields: one(textFields, {
        fields: [textFieldStatus.textField],
        references: [textFields.id],
        relationName: "textFields",
    })
}));

export const fileFieldStatusRelations = relations(fileFieldStatus, ({ one }) => ({
    fileFieldStatus: one(users, {
        fields: [fileFieldStatus.userEmail],
        references: [users.email],
        relationName: "fileFieldStatus",
    }),
    fileFields: one(fileFields, {
        fields: [fileFieldStatus.fileField],
        references: [fileFields.id],
        relationName: "fileFields",
    })
}));

export const fileRelations = relations(files, ({ one }) => ({
    files: one(users, {
        fields: [files.uploaded_by],
        references: [users.email],
        relationName: "files",
    })
}))
