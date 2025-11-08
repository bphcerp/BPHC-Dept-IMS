import {
    pgTable,
    uuid,
    pgEnum,
    text
} from "drizzle-orm/pg-core";
import { faculty } from "./admin.ts";
import { v4 as uuidv4 } from "uuid";
import { analyticsSchemas } from "lib";

export const graphTypeEnum = pgEnum(
    "graph_type_enum",
    analyticsSchemas.graphEnumValues
);

export const graphDataTypeEnum = pgEnum(
    "graph_data_type_enum",
    analyticsSchemas.graphDataType
);

export const graphMetricEnum = pgEnum(
    "graph_metric_enum",
    analyticsSchemas.graphMetricType
);

export const yAxisEnum = pgEnum(
    "y_axis_enum",
    analyticsSchemas.yAxisEnumValues
);

export const presentationTemplates = pgTable("presentation_templates", {
    id: uuid("id")
        .primaryKey().notNull()
        .$defaultFn(() => uuidv4()),
    title: text("title").notNull(),
    facultyEmail: text("faculty_email").notNull().references(() => faculty.email),
});

export const presentationSlides = pgTable("presentation_slides", {
    id: uuid()
        .primaryKey().notNull()
        .$defaultFn(() => uuidv4()),
    templateId: uuid("slide_id").notNull().references(() => presentationTemplates.id, {onDelete: 'cascade'}), 
    title: text("slide_title").notNull()
})

export const graphs = pgTable("graphs", {
    id: uuid("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),
    slideId: uuid("slide_id").notNull().references(() => presentationSlides.id, {onDelete: 'cascade'}), 
    title: text('graph_title').notNull(),
    yAxis: yAxisEnum("y_axis"),
    graphType: graphTypeEnum("graph_type"),
    dataType: graphDataTypeEnum("data_type").notNull(),
    metricType: graphMetricEnum("graph_metric").notNull(), 
});

export const textBoxes = pgTable("textboxes", {
    id: uuid("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),
    title: text('text_title').notNull(),
    slideId: uuid("slide_id").notNull().references(() => presentationSlides.id, {onDelete: 'cascade'}),
    body: text("body").notNull()
})

