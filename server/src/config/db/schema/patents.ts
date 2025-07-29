import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";

export const patentStatusEnum = pgEnum("patent_status", [
  "Pending",
  "Filed",
  "Granted",
  "Abandoned",
  "Rejected",
]);

export const patentInventors = pgTable("patent_inventors", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
  patentId: uuid("patent_id").notNull().references(() => patents.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  department: text("department"),
  campus: text("campus"),
  affiliation: text("affiliation"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const patents = pgTable("patents", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv4()),
  applicationNumber: text("application_number").notNull(),
  inventorsName: text("inventors_name").notNull(), // Keep for backward compatibility
  inventors: jsonb("inventors"), // New field for storing inventor data as JSON
  department: text("department").notNull(),
  title: text("title").notNull(),
  campus: text("campus").notNull(),
  filingDate: date("filing_date").notNull(),
  applicationPublicationDate: date("application_publication_date"),
  grantedDate: date("granted_date"),
  filingFY: text("filing_fy").notNull(),
  filingAY: text("filing_ay").notNull(),
  publishedAY: text("published_ay"),
  publishedFY: text("published_fy"),
  grantedFY: text("granted_fy"),
  grantedAY: text("granted_ay"),
  grantedCY: text("granted_cy"),
  status: patentStatusEnum("status").notNull(),
  grantedPatentCertificateLink: text("granted_patent_certificate_link"),
  applicationPublicationLink: text("application_publication_link"),
  form01Link: text("form_01_link"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}); 