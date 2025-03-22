import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import z from "zod";

const router = express.Router();


router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const schema = z.object({
            email: z.string().email(),
            finalDacMembers: z.array(z.string().email()).length(2)
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid input format"));
        }

        const { email, finalDacMembers } = parsed.data;

        const student = await db
            .select()
            .from(phd)
            .where(eq(phd.email, email))
            .then(rows => rows[0] || null);

        if (!student) {
            return next(new HttpError(HttpCode.NOT_FOUND, "PhD student not found"));
        }

        await db
            .update(phd)
            .set({
                dac1Email: finalDacMembers[0],
                dac2Email: finalDacMembers[1]
            })
            .where(eq(phd.email, email));

        res.json({
            success: true,
            message: "DAC members assigned successfully"
        });
    })
);

export default router;
