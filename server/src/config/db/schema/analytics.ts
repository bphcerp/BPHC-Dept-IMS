import {
    pgTable,
    uuid,
    pgEnum,
    text,
    integer
} from "drizzle-orm/pg-core";
import { faculty } from "./admin.ts";
import { v4 as uuidv4 } from "uuid";
import { analyticsSchemas } from "lib";

export const colorsEnum = pgEnum("template_colors_enum", analyticsSchemas.COLORS);
export const graphTypeEnum = pgEnum(
    "graph_type_enum",
    analyticsSchemas.graphEnumValues
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
    slides: integer("slides").notNull(),
    facultyEmail: text("faculty_email").notNull().references(() => faculty.email),
});

export const graphs = pgTable("graphs", {
    id: uuid("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),
    templateId: uuid("template_id").notNull().references(() => presentationTemplates.id, {onDelete: 'cascade'}), 
    slideNumber: integer("slide_number").notNull(),
    yAxis: yAxisEnum("y_axis"),
    graphType: graphTypeEnum("graph_type"),
    color: colorsEnum("color"),
});

