import express from "express";
import { z } from "zod";
import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import nodemailer from "nodemailer";
import env from "@/config/environment.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

const notificationSchema = z.object({
    email: z.string().email(),
    subject: z.string().min(1),
    body: z.string().min(1),
    link: z.string().url().optional(),
});

router.post(
    "/",
    checkAccess("drc-send-notification"),
    asyncHandler(async (req, res, next) => {
    const parsed = notificationSchema.parse(req.body);

    // Verify PhD student exists
    const phdStudent = await db.query.phd.findFirst({
        where: eq(phd.email, parsed.email),
    });

    if (!phdStudent) {
        return next(new HttpError(HttpCode.NOT_FOUND, "PhD student not found"));
    }

    if (env.PROD) {
        try {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: env.BPHCERP_EMAIL,
                    pass: env.BPHCERP_PASSWORD,
                },
            });

        const emailText = [
            parsed.body,
            parsed.link && `\nAccess link: ${parsed.link}`
        ].filter(Boolean).join('\n');

            await transporter.sendMail({
                from: env.BPHCERP_EMAIL,
                to: parsed.email,
                subject: parsed.subject,
                text: emailText,
            });
        } catch (e) {
        throw new HttpError(
            HttpCode.INTERNAL_SERVER_ERROR,
            "Notification failed: error sending email",
            (e as Error)?.message
        );
        }
    }

    res.status(200).json({ success: true });
    })
);

export default router;