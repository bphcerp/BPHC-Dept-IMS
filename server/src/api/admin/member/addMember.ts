import express from "express";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import db from "@/config/db";
import { users } from "@/config/db/schema/admin";
import { eq } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors";
import { asyncHandler } from "@/middleware/routeHandler";
import nodemailer from "nodemailer";
import env from "@/config/environment";
import { checkAccess } from "@/middleware/auth";
const router = express.Router();

// Define the request body schema
const addMemberBodySchema = z.object({
    email: z.string().email(),
    role: z.string(),
});

// POST /add-member
// validate the request of the body (email and role)
// checks for any existing user
// if user exists then adds to the database else returns
// uses nodemailer to send emails, used an app password for it
// if error occurs while sending email, the user is deleted
router.post(
    "/",
    checkAccess("user:create"),
    
    asyncHandler(async (req, res, next) => {
        const parseResult = addMemberBodySchema.safeParse(req.body);
        if (!parseResult.success) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Invalid request body",
                    fromError(parseResult.error).toString()
                )
            );
        }

        const { email } = parseResult.data;

        try {
            const existingUser = await db.query.users.findFirst({
                where: eq(users.email, email),
            });

            if (existingUser) {
                return next(new HttpError(HttpCode.CONFLICT, "User already exists"));
            }

            await db.insert(users).values({ email });

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: env.BPHCERP_EMAIL,
                    pass: env.BPHCERP_PASSWORD,
                },
            });

            const invitationLink = `${env.FRONTEND_URL}`;
            await transporter.sendMail({
                from: env.BPHCERP_EMAIL,
                to: email,
                subject: "You're Invited!",
                text: `Hello! You've been added as a member. Click here to join: ${invitationLink}`,
            });

            res.status(200).json({ message: "User added and invitation sent" });
        } catch (error) {
            
            console.error("Error occurred:", error);

            try {
                await db.delete(users).where(eq(users.email, email));
            } catch (deleteError) {
                console.error("Error rolling back the database:", deleteError);
            }

            if (error instanceof HttpError) {
                return next(error);
            }

            return next(
                new HttpError(
                    HttpCode.INTERNAL_SERVER_ERROR,
                    "Failed to send invitation email and rollback database changes"
                )
            );
        }
    })
);

export default router;
