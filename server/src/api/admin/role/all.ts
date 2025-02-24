import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { adminSchemas } from "lib";
const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, _) => {
        const { q: searchQuery } = adminSchemas.roleSearchQuerySchema.parse(
            req.query
        );
        const allRoles = await db.query.roles.findMany({
            columns: {
                roleName: true,
                memberCount: true,
            },
            where: (fields, { ilike }) =>
                searchQuery?.length
                    ? ilike(fields.roleName, `%${searchQuery}%`)
                    : undefined,
        });
        res.json(allRoles);
    })
);

export default router;
