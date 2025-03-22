import db from "@/config/db/index.ts";
import {
    faculty,
    permissions,
    roles,
    users,
} from "@/config/db/schema/admin.ts";
import { allPermissions } from "lib";

const seedData = async (email: string) => {
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
};

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error("Please provide an email address");
} else {
    console.log("Seeding data...");
    await seedData(args[0]);
}
