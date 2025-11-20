import { pgTable, text, date, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const facultyContributionStatusEnum = pgEnum("faculty_contribution_status", [
  "pending",
  "approved",
  "rejected",
]);

export const facultyContributions = pgTable("faculty_contributions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  facultyEmail: text("faculty_email").notNull(),
  designation: text("designation").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: facultyContributionStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFacultyContributionSchema = createInsertSchema(
  facultyContributions
);
export const selectFacultyContributionSchema = createSelectSchema(
  facultyContributions
);

export type FacultyContribution = z.infer<
  typeof selectFacultyContributionSchema
>;
export type NewFacultyContribution = z.infer<
  typeof insertFacultyContributionSchema
>;
