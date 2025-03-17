import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import z from "zod";
import { eq } from "drizzle-orm";

const router = express.Router();

const assignNotionalSupervisorSchema = z.object({
    email: z.string().email(),
    notionalSupervisorEmail: z.string().email(),
});

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = assignNotionalSupervisorSchema.parse(req.body);

        const updated = await db
            .update(phd)
            .set({ notionalSupervisorEmail: parsed.notionalSupervisorEmail })
            .where(eq(phd.email, parsed.email))
            .returning();

        if (updated.length === 0) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "PhD record not found")
            );
        }

        res.json({ success: true, phd: updated[0] });
    })
);

export default router;
