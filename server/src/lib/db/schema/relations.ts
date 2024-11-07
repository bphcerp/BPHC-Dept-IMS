import { relations } from "drizzle-orm";
import { refreshTokens, roles, users } from "./users";
import { applications, status, uploads } from "./applications";

export const usersRelations = relations(users, ({ one, many }) => ({
    refreshTokens: many(refreshTokens, {
        relationName: "user",
    }),
    role: one(roles, {
        fields: [users.role],
        references: [roles.role],
        relationName: "role",
    }),
    applications: many(applications, {
        relationName: "user",
    }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
    user: one(users, {
        fields: [refreshTokens.userEmail],
        references: [users.email],
        relationName: "user",
    }),
}));

export const roleRelations = relations(roles, ({ many }) => ({
    users: many(users, {
        relationName: "role",
    }),
}));

export const applicationsRelations = relations(
    applications,
    ({ one, many }) => ({
        user: one(users, {
            fields: [applications.userEmail],
            references: [users.email],
            relationName: "user",
        }),
        uploads: many(uploads, {
            relationName: "application",
        }),
    })
);

export const uploadsRelations = relations(uploads, ({ one, many }) => ({
    application: one(applications, {
        fields: [uploads.applicationId],
        references: [applications.id],
        relationName: "application",
    }),
    status: many(status, {
        relationName: "upload",
    }),
}));

export const statusRelations = relations(status, ({ one }) => ({
    upload: one(uploads, {
        fields: [status.uploadId],
        references: [uploads.id],
        relationName: "upload",
    }),
}));
