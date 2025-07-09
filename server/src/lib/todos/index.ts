import db from "@/config/db/index.ts";
import { notifications, todos } from "@/config/db/schema/todos.ts";
import { eq, and, sql } from "drizzle-orm";
import type { modules } from "lib";

/**
 * Creates a new todo item in the database.
 */
export async function createTodos(
    values: typeof todos.$inferInsert[]
) {
    if (!values.length) return [];
    const newTodos = await db.insert(todos).values(values).returning().onConflictDoUpdate({
        target: [todos.module, todos.assignedTo, todos.completionEvent],
        set: {
            title: sql`EXCLUDED.title`,
            description: sql`EXCLUDED.description`,
            link: sql`EXCLUDED.link`,
            createdBy: sql`EXCLUDED.createdBy`,
            createdAt: sql`EXCLUDED.createdAt`,
            deadline: sql`EXCLUDED.deadline`,
            metadata: sql`EXCLUDED.metadata`,
        },
    });
    return newTodos;
}

/**
 * Marks a todo as completed by deleting it from the database.
 */
export async function completeTodo({
    module,
    completionEvent,
    assignedTo,
}: {
    module: (typeof modules)[number];
    completionEvent: string;
    assignedTo: string;
}) {
    const result = await db
        .delete(todos)
        .where(
            and(
                eq(todos.module, module),
                eq(todos.completionEvent, completionEvent),
                eq(todos.assignedTo, assignedTo)
            )
        );

    return result.rowCount;
}

/**
 * Creates new notifications in the database.
 */
export async function createNotifications(
    values: typeof notifications.$inferInsert[],
    sendEmails = false
) {
    if (!values.length) return [];
    const newNotifs = await db.insert(notifications).values(values).returning();
    if (sendEmails) {
        // todo: send emails to users about the new notifications
    }
    return newNotifs;
}
