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

const router = express.Router();

// Define the request body schema
const addMemberBodySchema = z.object({
    email: z.string().email(),
    role: z.string(),
});

// POST /add-member
router.post(
    "/add-member",
    asyncHandler(async (req, res, next) => {
        // Validate the request body
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

        const { email, role } = parseResult.data;

        try {
            // Check if the user already exists
            const existingUser = await db.query.users.findFirst({
                where: eq(users.email, email),
            });

            if (existingUser) {
                return next(new HttpError(HttpCode.CONFLICT, "User already exists"));
            }

            // Add the new user to the database (INSERT operation)
            await db.insert(users).values({ email, roles: [role] });

            // Send an invitation email
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
                text: `Hello! You've been added as a ${role}. Click here to join: ${invitationLink}`,
            });

            // Respond with success if everything is fine
            res.status(200).json({ message: "User added and invitation sent" });
        } catch (error) {
            // If there is an error (like email sending), rollback the database operation
            // Manually delete the user from the database (rollback behavior)
            console.error("Error occurred:", error);

            try {
                // Attempt to remove the user from the database
                await db.delete(users).where(eq(users.email, email));
            } catch (deleteError) {
                console.error("Error rolling back the database:", deleteError);
            }

            // Send an appropriate error response to the client
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
