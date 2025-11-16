import { pgTable, varchar, uuid, date, pgEnum, timestamp } from "drizzle-orm/pg-core";

export const facultyContributionStatusEnum = pgEnum("faculty_contribution_status", ["pending", "approved", "rejected"]);

export const facultyContributions = pgTable("faculty_contributions", {
    id: uuid("id").primaryKey().defaultRandom(),
    facultyEmail: varchar("faculty_email", { length: 256 }).notNull(),
    designation: varchar("designation", { length: 256 }).notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: facultyContributionStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
