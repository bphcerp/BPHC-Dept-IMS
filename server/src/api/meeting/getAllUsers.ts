// server/src/api/meeting/getAllUsers.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { users } from "@/config/db/schema/admin.ts";
import { eq, and, ne } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess("meeting:use"),
    asyncHandler(async (req, res) => {
        const organizerEmail = req.user!.email;
        const allFaculty = await db.query.users.findMany({
            where: and(
                eq(users.deactivated, false),
                eq(users.type, "faculty"),
                ne(users.email, organizerEmail)
            ),
            columns: {
                name: true,
                email: true,
            },
            orderBy: (users, { asc }) => [asc(users.name)],
        });
        res.status(200).json(allFaculty);
    })
);

export default router;
