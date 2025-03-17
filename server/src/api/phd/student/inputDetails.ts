import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import assert from "assert";
import { phdSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        assert(req.user);

        const parsed = phdSchemas.studentInputDetailsBodySchema.parse(req.body);

        const updated = await db
            .update(phd)
            .set(parsed)
            .where(eq(phd.email, req.user.email))
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
