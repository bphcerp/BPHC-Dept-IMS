import express from "express";
import { z } from "zod";
import db from "@/config/db/index.ts";
import { faculty, phd, users, userType } from "@/config/db/schema/admin.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import nodemailer from "nodemailer";
import env from "@/config/environment.ts";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

const bodySchema = z.intersection(
    z.object({
        email: z.string().email(),
        name: z.string().trim().nonempty(),
        psrn: z.string().trim().nonempty(),
        phone: z.string().trim().optional(),
        department: z.string().trim().optional(),
    }),
    z.discriminatedUnion("type", [
        z.object({
            type: z.literal(userType.enumValues[0]), // Faculty
            designation: z.string().trim().array().optional(),
            room: z.string().trim().optional(),
        }),
        z.object({
            type: z.literal(userType.enumValues[1]), // PhD
        }),
    ])
);

router.post(
    "/",
    checkAccess("member:invite"),
    asyncHandler(async (req, res, next) => {
        const parsed = bodySchema.parse(req.body);
        try {
            await db.transaction(async (db) => {
                // Insert the user into the database
                const insertedUser = await db
                    .insert(users)
                    .values({
                        email: parsed.email,
                        name: parsed.name,
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
                let insertedDetails;
                if (parsed.type === userType.enumValues[0]) {
                    insertedDetails = await db
                        .insert(faculty)
                        .values({
                            psrn: parsed.psrn,
                            email: insertedUser[0].email,
                            department: parsed.department,
                            designation: parsed.designation,
                            room: parsed.room,
                            phone: parsed.phone,
                        })
                        .onConflictDoNothing()
                        .returning();
                } else {
                    insertedDetails = await db
                        .insert(phd)
                        .values({
                            psrn: parsed.psrn,
                            email: insertedUser[0].email,
                            phone: parsed.phone,
                            department: parsed.department,
                        })
                        .onConflictDoNothing()
                        .returning();
                }
                if (insertedDetails.length === 0) {
                    throw new HttpError(HttpCode.CONFLICT, "Duplicate PSRN");
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
