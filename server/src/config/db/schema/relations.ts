import { relations } from "drizzle-orm";
import { refreshTokens, users } from "./admin";

export const usersRelations = relations(users, ({ many }) => ({
    refreshTokens: many(refreshTokens, {
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
