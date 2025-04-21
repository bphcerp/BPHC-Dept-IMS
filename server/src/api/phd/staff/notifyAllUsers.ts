import express from "express";
import { z } from "zod";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { users } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import env from "@/config/environment.ts";

const router = express.Router();

const notifyUsersSchema = z.object({
    subject: z.string(),
    body: z.string(),
    examId: z.number().optional(),
    examType: z.string(),
    dates: z.object({
        deadline: z.string().datetime(),
        examStartDate: z.string().datetime().optional(),
        examEndDate: z.string().datetime().optional(),
        vivaDate: z.string().datetime().optional(),
    }),
});

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        try {
            const { subject, body } = notifyUsersSchema.parse(req.body);

            // Get all active users from the database
            const allUsers = await db
                .select({
                    email: users.email,
                    type: users.type,
                })
                .from(users)
                .where(eq(users.deactivated, false));

            if (allUsers.length === 0) {
                throw new HttpError(HttpCode.NOT_FOUND, "No users found");
            }

            // Get all user emails
            const userEmails = allUsers.map((user) => user.email);

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
                    to: env.BPHCERP_EMAIL, // Send to self
                    bcc: userEmails, // Include all users as BCC
                    subject: subject,
                    html: body,
                });

                res.status(200).json({
                    success: true,
                    message: `Notification email sent to ${userEmails.length} users`,
                });
            } catch (e) {
                throw new HttpError(
                    HttpCode.INTERNAL_SERVER_ERROR,
                    "Notification failed: error sending email",
                    (e as Error)?.message
                );
            }
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
