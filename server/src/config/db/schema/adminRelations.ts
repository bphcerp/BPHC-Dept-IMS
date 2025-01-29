import { relations } from "drizzle-orm";
import { refreshTokens, users, faculty, phd } from "./admin";

export const usersRelations = relations(users, ({ many, one}) => ({
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
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
    user: one(users, {
        fields: [refreshTokens.userEmail],
        references: [users.email],
        relationName: "user",
    }),
}));

export const facultyRelations = relations(faculty, ({ one }) => ({
    user: one(users, {
        fields: [faculty.email],
        references: [users.email],
        relationName: "faculty",
    })
}));
export const phdRelations = relations(phd, ({ one }) => ({
    user: one(users, {
        fields: [phd.email],
        references: [users.email],
        relationName: "phd",
    })
}));