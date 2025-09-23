import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import express from "express";
import db from "@/config/db/index.ts";
import { users } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.post(
    "/",
    asyncHandler(async (req, res) => {
        assert(req.user);

        // get current roles of the user
        const data = await db
            .select({
                testerRollbackRoles: users.testerRollbackRoles,
                inTestingMode: users.inTestingMode,
            })
            .from(users)
            .where(eq(users.email, req.user.email));
        if (!data.length) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (!data[0].inTestingMode) {
            res.status(400).json({ message: "Testing has not begun yet" });
            return;
        }

        // move roles from tester rollback roles to roles
        const updateUser = await db
            .update(users)
            .set({
                roles: data[0].testerRollbackRoles,
                testerRollbackRoles: [],
                inTestingMode: false,
            })
            .where(eq(users.email, req.user.email));
        if (!updateUser || !updateUser.rowCount) {
            res.status(500).json({ message: "Failed to update user" });
            return;
        }

        res.status(200).json({ message: "Testing mode ended successfully" });
    })
);

export default router;
