import { sql } from "drizzle-orm";
import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { pgEnum, boolean } from "drizzle-orm/pg-core";
import { adminSchemas } from "lib";

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
    email: text("email").primaryKey(),
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
        .references(() => users.email, { onDelete: "restrict" }),
    name: text("name"),
    department: text("department"),
    designation: text("designation")
        .array()
        .default(sql`'{}'::text[]`),
    room: text("room"),
    phone: text("phone"),
});

export const phd = pgTable("phd", {
    email: text("email")
        .primaryKey()
        .references(() => users.email, { onDelete: "restrict" }),
    department: text("department"),
    phone: text("phone"),

    idNumber: text("id_number"),
    erpId: text("erp_id"),
    name: text("name"),
    instituteEmail: text("institute_email"),
    mobile: text("mobile"),
    personalEmail: text("personal_email"),

    notionalSupervisorEmail: text("notional_supervisor_email").references(
        () => users.email,
        { onDelete: "restrict" }
    ),
    supervisorEmail: text("supervisor_email").references(() => users.email, {
        onDelete: "restrict",
    }),
    coSupervisorEmail: text("co_supervisor_email").references(
        () => users.email,
        { onDelete: "restrict" }
    ),
    coSupervisorEmail2: text("co_supervisor_email_2").references(
        () => users.email,
        { onDelete: "restrict" }
    ),
    dac1Email: text("dac_1_email").references(() => users.email, {
        onDelete: "restrict",
    }),
    dac2Email: text("dac_2_email").references(() => users.email, {
        onDelete: "restrict",
    }),

    natureOfPhD: text("nature_of_phd"),
    qualifyingExam1: boolean("qualifying_exam_1"),
    qualifyingExam2: boolean("qualifying_exam_2"),

    qualifyingExam1StartDate: timestamp("qualifying_exam_1_start_date").default(sql`NULL`),
    qualifyingExam1EndDate: timestamp("qualifying_exam_1_end_date").default(sql`NULL`),
    qualifyingExam2StartDate: timestamp("qualifying_exam_2_start_date").default(sql`NULL`), 
    qualifyingExam2EndDate: timestamp("qualifying_exam_2_end_date").default(sql`NULL`),

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
        .references(() => users.email, { onDelete: "restrict" }),
    name: text("name"),
    department: text("department"),
    phone: text("phone"),
    designation: text("designation")
        .array()
        .default(sql`'{}'::text[]`),
});
