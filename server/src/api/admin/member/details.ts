import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { users } from "@/config/db/schema/admin.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { eq } from "drizzle-orm";
import { adminSchemas } from "lib";
const router = express.Router();

router.get(
    "/",
    checkAccess("admin"),
    asyncHandler(async (req, res, next) => {
        const parsed = adminSchemas.memberDetailsQuerySchema.parse(req.query);
        const roles = (await db.query.roles.findMany()).reduce(
            (acc, role) => {
                acc[role.id] = role.roleName;
                return acc;
            },
            {} as Record<number, string>
        );
        const user = await db.query.users.findFirst({
            where: eq(users.email, parsed.email),
            with: {
                faculty: true,
                phd: {
                    columns: {
                        idNumber: true,
                        erpId: true,
                        name: true,
                        instituteEmail: true,
                        mobile: true,
                        personalEmail: true,
                    },
                },
                staff: true,
            },
        });
        if (!user) {
            return next(new HttpError(HttpCode.NOT_FOUND, "User not found"));
        }
        const { faculty, phd, staff, ...userData } = user;
        const data: adminSchemas.MemberDetailsResponse = {
            ...userData,
            roles: userData.roles.map((role) => roles[role]),
            ...(phd || faculty || staff),
        };
        res.status(200).json(data);
    })
);

export default router;
