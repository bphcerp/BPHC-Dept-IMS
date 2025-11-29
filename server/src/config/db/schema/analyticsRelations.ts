import { relations } from "drizzle-orm";
import { presentationTemplates, graphs, textBoxes , presentationSlides} from "./analytics.ts";
import { faculty } from "./admin.ts";

export const presentationTemplateRelations = relations(presentationTemplates, ({one, many}) => ({
    faculty: one( faculty, {
        fields: [presentationTemplates.facultyEmail],
        references: [faculty.email]
    }),
    slides: many(presentationSlides)
}))

export const presentationSlideRelations = relations(presentationSlides, ({one, many}) => ({
    template: one( presentationTemplates, {
        fields: [presentationSlides.templateId],
        references: [presentationTemplates.id]
    }),
    graphs: many(graphs),
    textBoxes: many(textBoxes),
}))


export const graphsRelations = relations(graphs, ({one}) => ({
    template: one( presentationSlides, {
        fields: [graphs.slideId],
        references: [presentationSlides.id]
    })
}))

export const textBoxesRelations = relations(textBoxes, ({one}) => ({
    template: one( presentationSlides, {
        fields: [textBoxes.slideId],
        references: [presentationSlides.id]
    })
}))