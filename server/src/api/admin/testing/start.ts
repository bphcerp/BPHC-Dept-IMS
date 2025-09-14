import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { roles, users } from "@/config/db/schema/admin.ts";
import { eq, inArray } from "drizzle-orm";
import { startTestingBodySchema } from "node_modules/lib/src/schemas/Admin.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess("admin:tester"),
    asyncHandler(async (req, res) => {
        assert(req.user);

        const { testerRoles } = startTestingBodySchema.parse(req.body);

        // get current roles of the user
        const data = await db
            .select({ roles: users.roles, inTestingMode: users.inTestingMode })
            .from(users)
            .where(eq(users.email, req.user.email));
        if (!data.length) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (data[0].inTestingMode) {
            res.status(400).json({ message: "Already in testing mode" });
            return;
        }

        // get roles ids from role names
        const roleIDs = await db
            .select({ id: roles.id })
            .from(roles)
            .where(inArray(roles.roleName, testerRoles));
        if (!roleIDs.length) {
            res.status(400).json({ message: "No valid role found" });
            return;
        }

        // move roles to tester rollback roles and assign new testing roles
        const updateUser = await db
            .update(users)
            .set({
                roles: roleIDs.map((r) => r.id),
                testerRollbackRoles: data[0].roles,
                inTestingMode: true,
            })
            .where(eq(users.email, req.user.email));
        if (!updateUser || !updateUser.rowCount) {
            res.status(500).json({ message: "Failed to update user roles" });
            return;
        }

        res.status(200).json({ message: "Testing mode started successfully" });
    })
);

export default router;
