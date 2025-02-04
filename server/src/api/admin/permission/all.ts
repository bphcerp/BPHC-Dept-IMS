import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { z } from "zod";

const router = express.Router();

const querySchema = z.object({
    q: z.string().trim().optional(),
});

router.get(
    "/",
    checkAccess("admin"),
    asyncHandler(async (req, res, _) => {
        const { q: searchQuery } = querySchema.parse(req.query);
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
