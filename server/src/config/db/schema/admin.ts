import { sql } from "drizzle-orm";
import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { pgEnum, boolean } from "drizzle-orm/pg-core";
export const userType = pgEnum("user_type", ["faculty", "phd"]);

export const permissions = pgTable("permissions", {
    permission: text("permission").primaryKey(),
    description: text("description"),
});

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
    name: text("name").notNull(),
    roles: text("roles")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    deactivated: boolean("deactivated").notNull().default(false),
    type: userType("type").notNull(),
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

export const faculty = pgTable("faculty", {
    psrn: text("psrn").unique(),
    email: text("email")
        .primaryKey()
        .references(() => users.email, { onDelete: "restrict" }),
    department: text("department"),
    designation: text("designation"),
    room: text("room"),
    phone: text("phone"),
});

export const phd = pgTable("phd", {
    psrn: text("psrn").unique(),
    email: text("email")
        .primaryKey()
        .references(() => users.email, { onDelete: "restrict" }),
    department: text("department"),
    phone: text("phone"),
});
