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

        const insertedRoles = await db.insert(roles)
            .values({
                role: parsed.data.name,
            })
            .onConflictDoNothing()
            .returning(); 

        if (insertedRoles.length === 0) {
            res.status(400).json({ error: "role already exists" });
            return next();
        }
        
        res.json({ success: true });
    })
);

export default router;