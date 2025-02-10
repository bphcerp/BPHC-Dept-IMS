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
