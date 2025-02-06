import { relations } from "drizzle-orm";
import { phdApplications, phdApplicationStatus } from "./phd.ts";
import { phd } from "./admin.ts";

export const phdApplicationsRelations = relations(phdApplications, ({ one, many }) => ({
    phdUser: one(phd, {
        fields: [phdApplications.email],
        references: [phd.email],
        relationName: "phd",
    }),
    phdApplicationStatuses: many(phdApplicationStatus), // One-to-Many relation added

}));

export const phdApplicationStatusRelations = relations(phdApplicationStatus, ({ one }) => ({
    phdApplication: one(phdApplications, {
        fields: [phdApplicationStatus.applicationId],
        references: [phdApplications.applicationId],
        relationName: "phd_application_status",
    }),
}));