import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import express from "express";
import db from "@/config/db/index.ts";
import { roles, users } from "@/config/db/schema/admin.ts";
import { eq, inArray } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        assert(req.user);

        const data = await db
            .select({
                inTestingMode: users.inTestingMode,
                roles: users.roles,
            })
            .from(users)
            .where(eq(users.email, req.user.email));
        if (!data.length) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        let parsedRoles: string[] = [];
        if (data[0].inTestingMode) {
            const roleIds = data[0].roles;
            const rolesData = await db
                .select({
                    name: roles.roleName,
                })
                .from(roles)
                .where(inArray(roles.id, roleIds));

            parsedRoles.push(...rolesData.map((role) => role.name));
        }

        res.status(200).json({
            inTestingMode: data[0].inTestingMode,
            roles: parsedRoles,
        });
    })
);

export default router;
