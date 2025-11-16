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

    const facultyPermissions = [
        "phd:faculty:proposal",
        "handout:faculty:submit",
        "handout:faculty:get-all-handouts",
        "publications:view",
        "project:create",
        "project:view",
        "patent:create",
        "patent:view",
        "wilp:project:view-selected",
        "grades:supervisor:view",
        "qp:faculty:submit",
        "qp:faculty:review",
        "allocation:form:response:submit",
        "contribution:submit",
    ];

    const hodPermissions = [
        ...facultyPermissions,
        "conference:application:hod",
        "phd-request:hod:view",
        "phd-request:hod:review",
        "contribution:review",
    ];

    const insertedRoles = await db
        .insert(roles)
        .values([
            {
                roleName: "developer",
                allowed: ["*"],
            },
            {
                roleName: "faculty",
                allowed: facultyPermissions,
            },
            {
                roleName: "HOD",
                allowed: hodPermissions,
            },
        ])
        .onConflictDoUpdate({
            target: roles.roleName,
            set: {
                allowed: roles.roleName.eq("developer")
                    ? ["*"]
                    : roles.roleName.eq("faculty")
                    ? facultyPermissions
                    : hodPermissions,
            },
        })
        .returning();

    if (email) {
        await db
            .insert(users)
            .values({
                email,
                type: "faculty",
                roles: insertedRoles.map((r) => r.id),
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