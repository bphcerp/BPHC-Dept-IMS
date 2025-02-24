import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { adminSchemas } from "lib";

const router = express.Router();

router.get(
    "/",
    checkAccess("admin:permission:read"),
    asyncHandler(async (req, res, _) => {
        const { q: searchQuery } =
            adminSchemas.permissionSearchQuerySchema.parse(req.query);
        const allPermissions = await db.query.permissions.findMany({
            where: (fields, { ilike }) =>
                searchQuery?.length
                    ? ilike(fields.permission, `%${searchQuery}%`)
                    : undefined,
        });
        res.json(allPermissions);
    })
);

export default router;
