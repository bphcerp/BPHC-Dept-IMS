import express from "express";
import db from "@/config/db/index.ts";
import { faculty, phd, staff, users } from "@/config/db/schema/admin.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import nodemailer from "nodemailer";
import env from "@/config/environment.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { adminSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = adminSchemas.inviteMemberBodySchema.parse(req.body);
        try {
            await db.transaction(async (db) => {
                // Insert the user into the database
                const insertedUser = await db
                    .insert(users)
                    .values({
                        email: parsed.email,
                        type: parsed.type,
                        roles: [], // Default to an empty array for roles
                    })
                    .onConflictDoNothing()
                    .returning();
                if (insertedUser.length === 0) {
                    throw new HttpError(
                        HttpCode.CONFLICT,
                        "User already exists"
                    );
                }
                // Insert user details
                const insertedDetails = await db
                    .insert(
                        parsed.type === adminSchemas.userTypes[0]
                            ? faculty
                            : parsed.type === adminSchemas.userTypes[1]
                              ? phd
                              : staff
                    )
                    .values({
                        email: insertedUser[0].email,
                    })
                    .onConflictDoNothing()
                    .returning();

                if (insertedDetails.length === 0) {
                    throw new HttpError(
                        HttpCode.CONFLICT,
                        "User details already exist"
                    );
                }
                // Send invitation email
                if (env.PROD) {
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
                            to: parsed.email,
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
