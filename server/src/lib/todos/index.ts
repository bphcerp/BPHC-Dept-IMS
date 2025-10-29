import db, { type Tx } from "@/config/db/index.ts";
import { notifications, todos } from "@/config/db/schema/todos.ts";
import { eq, and, sql, inArray, or } from "drizzle-orm";
import type { modules } from "lib";

/**
 * Creates a new todo item in the database.
 */
export async function createTodos(
    values: (typeof todos.$inferInsert)[],
    tx: typeof db | Tx = db
) {
    if (!values.length) return [];
    const newTodos = await tx
        .insert(todos)
        .values(values)
        .returning()
        .onConflictDoUpdate({
            target: [todos.module, todos.assignedTo, todos.completionEvent],
            set: {
                title: sql`EXCLUDED.title`,
                description: sql`EXCLUDED.description`,
                link: sql`EXCLUDED.link`,
                createdBy: sql`EXCLUDED.created_by`,
                createdAt: sql`EXCLUDED.created_at`,
                deadline: sql`EXCLUDED.deadline`,
                metadata: sql`EXCLUDED.metadata`,
            },
        });
    return newTodos;
}

/**
 * Marks a todo as completed by deleting it from the database.
 */
export async function completeTodo(
    {
        module,
        completionEvent,
        assignedTo,
    }: {
        module: (typeof modules)[number];
        completionEvent: string | string[];
        assignedTo?: string | string[];
    },
    tx: typeof db | Tx = db
) {
    const result = await tx
        .delete(todos)
        .where(
            and(
                eq(todos.module, module),
                Array.isArray(completionEvent)
                    ? inArray(todos.completionEvent, completionEvent)
                    : eq(todos.completionEvent, completionEvent),
                assignedTo
                    ? Array.isArray(assignedTo)
                        ? inArray(todos.assignedTo, assignedTo)
                        : eq(todos.assignedTo, assignedTo)
                    : undefined
            )
        );

    return result.rowCount;
}

/**
 * Checks if todo tasks already exist in the database.
 */
export async function todoExists(
    values: {
        module: (typeof modules)[number];
        completionEvent: string;
        assignedTo: string;
    }[],
    tx: typeof db | Tx = db
): Promise<boolean[]> {
    if (!values.length) return [];

    // Query all existing todos that match any of the input combinations
    const existingTodos = await tx.query.todos.findMany({
        where: or(
            ...values.map(({ module, completionEvent, assignedTo }) =>
                and(
                    eq(todos.module, module),
                    eq(todos.completionEvent, completionEvent),
                    eq(todos.assignedTo, assignedTo)
                )
            )
        ),
        columns: {
            module: true,
            completionEvent: true,
            assignedTo: true,
        },
    });

    // Create a Set for O(1) lookup of existing combinations
    const existingSet = new Set(
        existingTodos.map(
            ({ module, completionEvent, assignedTo }) =>
                `${module}:${completionEvent}:${assignedTo}`
        )
    );

    // Map input values to boolean results
    return values.map(({ module, completionEvent, assignedTo }) =>
        existingSet.has(`${module}:${completionEvent}:${assignedTo}`)
    );
}

/**
 * Creates new notifications in the database.
 */
export async function createNotifications(
    values: (typeof notifications.$inferInsert)[],
    sendEmails = false,
    tx: typeof db | Tx = db
) {
    if (!values.length) return [];
    const newNotifs = await tx.insert(notifications).values(values).returning();
    if (sendEmails) {
        // todo: send emails to users about the new notifications
    }
    return newNotifs;
}
