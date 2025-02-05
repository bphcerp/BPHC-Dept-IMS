import { relations } from "drizzle-orm";
import { phdApplications, phdStatus } from "./phd.ts";
import { phd } from "./admin.ts";

export const phdApplicationsRelations = relations(phdApplications, ({ one }) => ({
    phdUser: one(phd, {
        fields: [phdApplications.email],
        references: [phd.email],
        relationName: "phd",
    }),
}));

export const phdStatusRelations = relations(phdStatus, ({ one }) => ({
    phdApplication: one(phdApplications, {
        fields: [phdStatus.applicationId],
        references: [phdApplications.applicationId],
        relationName: "phd_status",
    }),
}));