import { asyncHandler } from "@/middleware/routeHandler";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth";
import z from "zod";
import db from "@/config/db";
import { roles } from "@/config/db/schema/admin";
const router = express.Router();
const bodySchema = z.object({
    name: z.string().trim().nonempty().max(48),
})
router.post(
    "/",
    checkAccess("role:create"),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const parsed = bodySchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({ error: "invalid body" });
            return next();
        }
        
        const existingRole = await db.query.roles.findFirst({
            where: (roles, { eq }) => eq(roles.role, parsed.data.name)
        });

        if (existingRole) {
            res.status(401).json({ error: "Role already exists" });
            return next();
        }

        await db.insert(roles).values({
            role: parsed.data.name,
        }).onConflictDoNothing();
        
        res.json({ success: true });
    })
);

export default router;
