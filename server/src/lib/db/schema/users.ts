import { sql } from "drizzle-orm";
import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
    role: text("role").primaryKey(),
    allowed: text("allowed")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    disallowed: text("disallowed")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
});

export const users = pgTable("users", {
    email: text("email").primaryKey(),
    role: text("role").references(() => roles.role, { onDelete: "set null" }),
});

export const refreshTokens = pgTable("refresh_tokens", {
    id: serial("id").primaryKey(),
    userEmail: text("user_email")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", {
        withTimezone: true,
    }).notNull(),
});
