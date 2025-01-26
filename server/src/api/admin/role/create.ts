import { asyncHandler } from "@/middleware/routeHandler";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth";
import z from "zod";
import db from "@/config/db";
import { roles } from "@/config/db/schema/admin";
import { HttpCode, HttpError } from "@/config/errors";
const router = express.Router();
const bodySchema = z.object({
    name: z.string().trim().nonempty().max(48),
})
router.post(
    "/",
    checkAccess("role:create"),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const parsed = bodySchema.parse(req.body);
        const insertedRoles = await db.insert(roles)
            .values({
                role: parsed.name,
            })
            .onConflictDoNothing()
            .returning(); 

        if (insertedRoles.length === 0) {
            return next(new HttpError(HttpCode.CONFLICT, "Role already exists"));
        }
        
        res.json({ success: true });
    })
);

export default router;