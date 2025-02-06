import { relations } from "drizzle-orm";
import { phdApplications, phdApplicationStatus } from "./phd.ts";
import { phd } from "./admin.ts";

export const phdApplicationsRelations = relations(phdApplications, ({ one }) => ({
    phdUser: one(phd, {
        fields: [phdApplications.email],
        references: [phd.email],
        relationName: "phd",
    }),
}));

export const phdApplicationStatusRelations = relations(phdApplicationStatus, ({ one }) => ({
    phdApplication: one(phdApplications, {
        fields: [phdApplicationStatus.applicationId],
        references: [phdApplications.applicationId],
        relationName: "phd_application_status",
    }),
}));