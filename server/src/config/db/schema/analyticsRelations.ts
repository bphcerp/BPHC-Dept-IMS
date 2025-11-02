import { relations } from "drizzle-orm";
import { presentationTemplates, graphs } from "./analytics.ts";
import { faculty } from "./admin.ts";

export const presentationTemplateRelations = relations(presentationTemplates, ({one, many}) => ({
    faculty: one( faculty, {
        fields: [presentationTemplates.facultyEmail],
        references: [faculty.email]
    }),
    graphs: many(graphs)
}))

export const graphsRelations = relations(graphs, ({one}) => ({
    faculty: one( presentationTemplates, {
        fields: [graphs.templateId],
        references: [presentationTemplates.id]
    })
}))