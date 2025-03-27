import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { users } from "./admin.ts";

export const patents = pgTable("patents", {
    id: serial("id").primaryKey(),

    applicationNumber: text("application_number").notNull(),
    inventorsName: text("inventors_name").notNull(),
    department: text("department"),
    title: text("title"),
    campus: text("campus"),

    filingDate: text("filing_date"),
    applicationPublicationDate: text("application_publication_date"),
    grantedDate: text("granted_date"),

    filingFy: text("filing_fy"),
    filingAy: text("filing_ay"),
    publishedAy: text("published_ay"),
    publishedFy: text("published_fy"),
    grantedFy: text("granted_fy"),
    grantedAy: text("granted_ay"),
    grantedCy: text("granted_cy"),
    status: text("status"),
});

export const patentInventors = pgTable("patent_inventors", {
    id: serial("id").primaryKey(),

    patentId: integer("patent_id").references(() => patents.id, {
        onDelete: "cascade",
    }),

    userEmail: text("user_email")
        .notNull()
        .references(() => users.email, { onDelete: "cascade" }),
});
