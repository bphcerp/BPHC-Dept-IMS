import {
    pgTable,
    timestamp,
    jsonb,
    serial,
    text,
    boolean,
    index,
} from "drizzle-orm/pg-core";
import { modulesEnum } from "./form.ts";
import { users } from "./admin.ts";

export const todos = pgTable(
    "todos",
    {
        id: serial("id").primaryKey(),
        module: modulesEnum("module").notNull(),
        title: text("title").notNull(),
        description: text("description"),
        link: text("link"),
        assignedTo: text("assigned_to")
            .notNull()
            .references(() => users.email, { onDelete: "cascade" }),
        createdBy: text("created_by")
            .notNull()
            .references(() => users.email, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        deadline: timestamp("deadline", { withTimezone: true }),
        completionEvent: text("completion_event").notNull(),
        metadata: jsonb("metadata"),
    },
    (table) => [index("assigned_to_idx").on(table.assignedTo)]
);

export const notifications = pgTable(
    "notifications",
    {
        id: serial("id").primaryKey(),
        module: modulesEnum("module").notNull(),
        title: text("title").notNull(),
        content: text("content"),
        userEmail: text("user_email")
            .notNull()
            .references(() => users.email, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        link: text("link"),
        read: boolean("read").notNull().default(false),
    },
    (table) => [
        index("read_idx").on(table.read),
        index("user_idx").on(table.userEmail),
    ]
);
