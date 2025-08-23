import { sql } from "drizzle-orm";
import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { pgEnum, boolean } from "drizzle-orm/pg-core";
import { adminSchemas } from "lib";
import { files } from "./form.ts";

export const userType = pgEnum("user_type", adminSchemas.userTypes);

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
        { onDelete: "cascade" }
    ),
    supervisorEmail: text("supervisor_email").references(() => users.email, {
        onDelete: "cascade",
    }),
    coSupervisorEmail: text("co_supervisor_email").references(
        () => users.email,
        { onDelete: "cascade" }
    ),
    coSupervisorEmail2: text("co_supervisor_email_2").references(
        () => users.email,
        { onDelete: "cascade" }
    ),
    dac1Email: text("dac_1_email").references(() => users.email, {
        onDelete: "cascade",
    }),
    dac2Email: text("dac_2_email").references(() => users.email, {
        onDelete: "cascade",
    }),

    natureOfPhD: text("nature_of_phd"),
    qualifyingExam1: boolean("qualifying_exam_1"),
    qualifyingExam2: boolean("qualifying_exam_2"),

    qualifyingExam1StartDate: timestamp("qualifying_exam_1_start_date").default(
        sql`NULL`
    ),
    qualifyingExam1EndDate: timestamp("qualifying_exam_1_end_date").default(
        sql`NULL`
    ),
    qualifyingExam2StartDate: timestamp("qualifying_exam_2_start_date").default(
        sql`NULL`
    ),
    qualifyingExam2EndDate: timestamp("qualifying_exam_2_end_date").default(
        sql`NULL`
    ),

    qualifyingArea1: text("qualifying_area_1").default(sql`NULL`),
    qualifyingArea2: text("qualifying_area_2").default(sql`NULL`),
    numberOfQeApplication: integer("number_of_qe_application").default(0),
    qualificationDate: timestamp("qualification_date", {
        withTimezone: true,
        mode: "date",
    }).default(sql`NULL`),
    suggestedDacMembers: text("suggested_dac_members")
        .array()
        .default(sql`'{}'::text[]`),
    qualifyingAreasUpdatedAt: timestamp("qualifying_areas_updated_at", {
        withTimezone: true,
        mode: "date",
    }).default(sql`NULL`),
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
