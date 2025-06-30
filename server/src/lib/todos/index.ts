import db from "@/config/db/index.ts";
import { notifications, todos } from "@/config/db/schema/todos.ts";
import { eq, and } from "drizzle-orm";
import type { modules } from "lib";

/**
 * Creates a new todo item in the database.
 */
export async function createTodos(
    values: {
        module: (typeof modules)[number];
        title: string;
        description?: string;
        link?: string;
        assignedTo: string;
        createdBy: string;
        completionEvent: string;
        metadata?: Record<string, unknown>;
    }[]
) {
    const newTodos = await db.insert(todos).values(values).returning();
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
    values: {
        module: (typeof modules)[number];
        title: string;
        content?: string;
        link?: string;
        userEmail: string;
    }[],
    sendEmails = false
) {
    const newNotifs = await db.insert(notifications).values(values).returning();
    if (sendEmails) {
        // todo: send emails to users about the new notifications
    }
    return newNotifs;
}
