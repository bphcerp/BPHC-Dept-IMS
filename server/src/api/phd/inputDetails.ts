import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import z from "zod";
import { eq } from "drizzle-orm";

const router = express.Router();

const phdSchema = z.object({
    department: z.string().optional(),
    phone: z.string().optional(),
    idNumber: z.string().optional(),
    erpId: z.string().optional(),
    name: z.string().nonempty(),
    instituteEmail: z.string().email().optional(),
    mobile: z.string().optional(),
    personalEmail: z.string().email().optional(),
});

router.post(
    "/",
    checkAccess("phd-inputDetails"),
    asyncHandler(async (req, res, next) => {
        if (!req.user?.email) {
            return next(new HttpError(HttpCode.UNAUTHORIZED, "Unauthenticated"));
        }

        const parsed = phdSchema.safeParse(req.body);
        if (!parsed.success) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid input data"));
        }

        const existingPhd = await db.query.phd.findFirst({
            where: eq(phd.email, req.user.email),
        });

        if (!existingPhd) {
            return next(new HttpError(HttpCode.NOT_FOUND, "PhD record not found"));
        }

        const updated = await db
            .update(phd)
            .set(parsed.data)
            .where(eq(phd.email, req.user.email))
            .returning();

        res.json({ success: true, phd: updated[0] });
    })
);

export default router;
