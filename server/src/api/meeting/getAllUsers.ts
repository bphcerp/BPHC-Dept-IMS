// server/src/api/meeting/getAllUsers.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { users } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get(
  "/",
  checkAccess("meeting:read-users"), // Using a more specific permission
  asyncHandler(async (_req, res) => {
    const allUsers = await db.query.users.findMany({
      where: eq(users.deactivated, false),
      columns: {
        name: true,
        email: true,
      },
      orderBy: (users, { asc }) => [asc(users.name)],
    });

    res.status(200).json(allUsers);
  })
);

export default router;