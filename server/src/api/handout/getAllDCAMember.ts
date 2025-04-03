import db from "@/config/db/index.ts";
//import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq, and, arrayContains } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    //checkAccess(),
    asyncHandler(async (_req, res, _next) => {
        const dcaMemberRole = await db.query.roles.findFirst({
            where: (roles) => eq(roles.roleName, "dca-member")
        });
        const dcaRoleId = dcaMemberRole.id;
        const dcaMembers = await db.query.users.findMany({
            with: {
                faculty: true,
            },
            where: (users) => {
                return and(
                    arrayContains(users.roles, [dcaRoleId]),
                    eq(users.deactivated, false)
                );
            }
        });
        const dca = dcaMembers
            .map((member) => {
                return {
                    name: member.faculty.name,
                    email: member.email,
                    deactivated: member.deactivated,
                }
            });
        res.status(200).json({ success: true, dca });
    })
);

export default router;