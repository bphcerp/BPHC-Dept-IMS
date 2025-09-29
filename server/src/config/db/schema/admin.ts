import { sql } from "drizzle-orm";
import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { pgEnum, boolean } from "drizzle-orm/pg-core";
import { adminSchemas, phdSchemas } from "lib";
import { files } from "./form.ts";

export const userType = pgEnum("user_type", adminSchemas.userTypes);
export const phdTypeEnum = pgEnum("phd_type", phdSchemas.phdTypes);

export const permissions = pgTable("permissions", {
    permission: text("permission").primaryKey(),
    description: text("description"),
});

export const roles = pgTable("roles", {
    id: serial("id").primaryKey(),
    roleName: text("role_name").unique().notNull(),
    memberCount: integer("member_count").notNull().default(0),
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
    id: serial("id").unique(),
    email: text("email").primaryKey(),
    name: text("name"),
    phone: text("phone"),
    description: text("description"),
    profileImage: text("profile_image"),
    designation: text("designation"),
    department: text("department"),
    education: text("education")
        .array()
        .default(sql`'{}'::text[]`),
    researchInterests: text("research_interests")
        .array()
        .default(sql`'{}'::text[]`),
    courses: text("courses")
        .array()
        .default(sql`'{}'::text[]`),
    linkedin: text("linkedin"),
    orchidID: text("orchid_id"),
    scopusID: text("scopus_id"),
    googleScholar: text("google_scholar"),
    additionalLinks: text("additional_links")
        .array()
        .default(sql`'{}'::text[]`),
    roles: integer("roles")
        .array()
        .notNull()
        .default(sql`'{}'::integer[]`),
        testerRollbackRoles: integer("tester_rollback_roles")
        .array()
        .notNull()
        .default(sql`'{}'::integer[]`),
    deactivated: boolean("deactivated").notNull().default(false),
    inTestingMode: boolean("in_testing_mode").notNull().default(false),
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
        .references(() => users.email, { onDelete: "cascade" }),
    name: text("name"),
    department: text("department"),
    designation: text("designation"),
    room: text("room"),
    phone: text("phone"),
    authorId: text("author_id").unique(),
    signatureFileId: integer("signature_file_id").references(() => files.id, {
        onDelete: "set null",
    }),
    profileFileId: integer("profile_file_id").references(() => files.id, {
        onDelete: "set null",
    }),
});

export const phd = pgTable("phd", {
    email: text("email")
        .primaryKey()
        .references(() => users.email, { onDelete: "cascade" }),
    department: text("department"),
    phdType: phdTypeEnum("phd_type").default("full-time").notNull(),
    phone: text("phone"),
    profileFileId: integer("profile_file_id").references(() => files.id, {
        onDelete: "set null",
    }),
    idNumber: text("id_number"),
    erpId: text("erp_id"),
    name: text("name"),
    instituteEmail: text("institute_email"),
    mobile: text("mobile"),
    personalEmail: text("personal_email"),
    emergencyPhoneNumber: text("emergency_phone_number"),
    notionalSupervisorEmail: text("notional_supervisor_email").references(
        () => users.email,
        { onDelete: "set null" }
    ),
    supervisorEmail: text("supervisor_email").references(() => users.email, {
        onDelete: "set null",
    }),
    qeAttemptCount: integer("qe_attempt_count").default(0).notNull(),
    hasPassedQe: boolean("has_passed_qe").default(false).notNull(),
    qualificationDate: timestamp("qualification_date", { withTimezone: true }),
});

export const staff = pgTable("staff", {
    email: text("email")
        .primaryKey()
        .references(() => users.email, { onDelete: "cascade" }),
    name: text("name"),
    department: text("department"),
    phone: text("phone"),
    designation: text("designation"),

    profileFileId: integer("profile_file_id").references(() => files.id, {
        onDelete: "set null",
    }),
});
