import db from "@/config/db/index.ts";
import {
    faculty,
    permissions,
    roles,
    users,
} from "@/config/db/schema/admin.ts";

const seedData = async (email: string) => {
    await db.insert(permissions).values([
        {
            permission: "*",
            description: "Catch all route",
        },
        {
            permission: "permission",
            description: "A generic permission",
        },
    ]);
    const insertedRoles = await db
        .insert(roles)
        .values({
            roleName: "admin",
            allowed: ["*"],
        })
        .onConflictDoNothing()
        .returning();
    await db.insert(users).values({
        email,
        type: "faculty",
        roles: [insertedRoles[0]?.id ?? 1],
    });
    await db.insert(faculty).values({
        email,
    });
};

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error("Please provide an email address");
} else {
    console.log("Seeding data...");
    await seedData(args[0]);
}
