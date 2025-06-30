import {
  pgTable,
  uuid,
  text,
  decimal,
  date,
  timestamp,
  pgEnum,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";

export const fundingAgencyNatureEnum = pgEnum("funding_agency_nature", [
  "public_sector",
  "private_industry",
]);

export const projectHeadEnum = pgEnum("project_head", [
  "CAPEX",
  "OPEX",
  "Manpower",
]);

export const fundingAgencies = pgTable("funding_agencies", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
  name: text("name").notNull(),
});

export const investigators = pgTable("investigators", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  department: text("department"),
  campus: text("campus"),
  affiliation: text("affiliation"),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
  title: text("title").notNull(),
  piId: uuid("pi_id").references(() => investigators.id).notNull(),
  fundingAgencyId: uuid("funding_agency_id").references(() => fundingAgencies.id).notNull(),
  fundingAgencyNature: fundingAgencyNatureEnum("funding_agency_nature").notNull(),
  sanctionedAmount: decimal("sanctioned_amount", { precision: 15, scale: 2 }).notNull(),
  capexAmount: decimal("capex_amount", { precision: 15, scale: 2 }),
  opexAmount: decimal("opex_amount", { precision: 15, scale: 2 }),
  manpowerAmount: decimal("manpower_amount", { precision: 15, scale: 2 }),
  approvalDate: date("approval_date").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  hasExtension: boolean("has_extension").notNull().default(false),
  extensionDetails: text("extension_details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projectCoPIs = pgTable(
  "project_co_pis",
  {
    projectId: uuid("project_id").references(() => projects.id),
    investigatorId: uuid("investigator_id").references(() => investigators.id),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.investigatorId] })]
); 