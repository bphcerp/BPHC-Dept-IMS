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
  email: text("email").primaryKey().references(() => users.email, { onDelete: "cascade" }),
  name: text("name"),
  idNumber: text("id_number"),
  erpId: text("erp_id"),
  department: text("department"),
  phone: text("phone"),
  instituteEmail: text("institute_email"),
  mobile: text("mobile"),
  personalEmail: text("personal_email"),
  natureOfPhD: text("nature_of_phd"),
  notionalSupervisorEmail: text("notional_supervisor_email").references(() => users.email),
  supervisorEmail: text("supervisor_email").references(() => users.email),
  coSupervisorEmail: text("co_supervisor_email").references(() => users.email),
  coSupervisorEmail2: text("co_supervisor_email_2").references(() => users.email),
  dac1Email: text("dac_1_email").references(() => users.email),
  dac2Email: text("dac_2_email").references(() => users.email),
  suggestedDacMembers: text("suggested_dac_members").array(),
  qualificationDate: timestamp("qualification_date"),
  isDeactivated: boolean('is_deactivated').notNull().default(false),
  
  // REMOVED COLUMNS:
  // qualifyingExam1, qualifyingExam2, 
  // qualifyingExam1StartDate, qualifyingExam1EndDate,
  // qualifyingExam2StartDate, qualifyingExam2EndDate,
  // qualifyingArea1, qualifyingArea2,
  // numberOfQeApplication, qualifyingAreasUpdatedAt
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
