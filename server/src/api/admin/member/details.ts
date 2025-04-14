import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { adminSchemas } from "lib";
import { getUserDetails } from "@/lib/common/index.ts";
const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = adminSchemas.memberDetailsQuerySchema.parse(req.query);
        const roles = (await db.query.roles.findMany()).reduce(
            (acc, role) => {
                acc[role.id] = role.roleName;
                return acc;
            },
            {} as Record<number, string>
        );
        const user = await getUserDetails(parsed.email);
        if (!user) {
            return next(new HttpError(HttpCode.NOT_FOUND, "User not found"));
        }
        const data: adminSchemas.MemberDetailsResponse = {
            ...user,
            roles: user.roles.map((role) => roles[role]),
        };
        res.status(200).json(data);
    })
);

export default router;
