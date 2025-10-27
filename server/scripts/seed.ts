import db from "@/config/db/index.ts";
import {
    faculty,
    permissions,
    roles,
    users,
} from "@/config/db/schema/admin.ts";
import { notInArray } from "drizzle-orm";
import { allPermissions } from "lib";
import { seedEmailTemplates } from "./emailTemplates.ts";

const seedData = async (email?: string) => {
    await db
        .delete(permissions)
        .where(notInArray(permissions.permission, Object.keys(allPermissions)));
    await db
        .insert(permissions)
        .values(
            Object.entries(allPermissions).map(([key, value]) => ({
                permission: key,
                description: value,
            }))
        )
        .onConflictDoNothing();
    const insertedRoles = await db
        .insert(roles)
        .values({
            roleName: "developer",
            allowed: ["*"],
        })
        .onConflictDoNothing()
        .returning();
    if (email) {
        await db
            .insert(users)
            .values({
                email,
                type: "faculty",
                roles: [insertedRoles[0]?.id ?? 1],
            })
            .onConflictDoNothing();
        await db
            .insert(faculty)
            .values({
                email,
            })
            .onConflictDoNothing();
    }

    await seedEmailTemplates();
};

const args = process.argv.slice(2);

console.log("Seeding data...");
await seedData(args.length ? args[0] : undefined);
