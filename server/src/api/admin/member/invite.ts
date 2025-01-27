import express from "express";
import { z } from "zod";
import db from "@/config/db";
import { users } from "@/config/db/schema/admin";
import { HttpError, HttpCode } from "@/config/errors";
import { asyncHandler } from "@/middleware/routeHandler";
import nodemailer from "nodemailer";
import env from "@/config/environment";
import { checkAccess } from "@/middleware/auth";

const router = express.Router();

const addMemberBodySchema = z.object({
    email: z.string().email(),
});

router.post(
    "/",
    checkAccess("member:invite"),
    asyncHandler(async (req, res, next) => {
        const { email } = addMemberBodySchema.parse(req.body);
        try {
            await db.transaction(async (db) => {
                // Insert the user into the database
                const inserted = await db
                    .insert(users)
                    .values({
                        email,
                        roles: [], // Default to an empty array for roles
                    })
                    .onConflictDoNothing()
                    .returning();
                if (inserted.length === 0) {
                    throw new HttpError(
                        HttpCode.CONFLICT,
                        "User already exists"
                    );
                }
                // Send invitation email
                try {
                    const transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                            user: env.BPHCERP_EMAIL,
                            pass: env.BPHCERP_PASSWORD,
                        },
                    });
                    await transporter.sendMail({
                        from: env.BPHCERP_EMAIL,
                        to: email,
                        subject: "Member invitation",
                        text: `Hello! You are invited to access the EEE ERP portal. Website link: ${env.FRONTEND_URL}`,
                    });
                } catch (e) {
                    throw new HttpError(
                        HttpCode.INTERNAL_SERVER_ERROR,
                        "Member invitation failed: error sending invitation email",
                        (e as Error)?.message
                    );
                }
                return res.status(200).json({ success: true });
            });
        } catch (e) {
            if (e instanceof HttpError) {
                return next(e);
            } else {
                throw e;
            }
        }
    })
);

export default router;
