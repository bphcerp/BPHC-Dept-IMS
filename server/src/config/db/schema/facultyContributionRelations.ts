import { relations } from "drizzle-orm";
import { facultyContributions } from "./facultyContribution";

export const facultyContributionsRelations = relations(facultyContributions, () => ({}));
