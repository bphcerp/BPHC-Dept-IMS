import { relations } from "drizzle-orm";
import { phdApplications } from "./phd.ts";
import { phd } from "./admin.ts";

export const phdApplicationsRelations = relations(phdApplications, ({ one }) => ({
    phdUser: one(phd, {
        fields: [phdApplications.email],
        references: [phd.email],
        relationName: "phd",
    }),
}));