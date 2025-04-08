import express from "express";
import { z } from "zod";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import env from "@/config/environment.ts";

const router = express.Router();

const notifySupervisorSchema = z.object({
    supervisorEmail: z.string().email(),
    deadline: z.string().datetime().optional(),
});

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        try {
            const { supervisorEmail, deadline } = notifySupervisorSchema.parse(
                req.body
            );

            // Find supervisor's students
            const supervisorStudents = await db.query.phd.findMany({
                where: eq(phd.supervisorEmail, supervisorEmail),
            });

            if (supervisorStudents.length === 0) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "No PhD students found under this supervisor"
                );
            }

            // Construct the email body
            const deadlineInfo = deadline
                ? `Please submit your suggestions by ${new Date(deadline).toLocaleDateString()}.`
                : "Please submit your suggestions as soon as possible.";

            const studentsList = supervisorStudents
                .map((student) => `- ${student.name} (${student.email})`)
                .join("\n");

            const emailBody = `
Dear Supervisor,

The Doctoral Research Committee requests you to suggest examiners for the qualifying examinations of your PhD students. ${deadlineInfo}

Your PhD students:
${studentsList}

Please use the IMS system to submit your suggestions.

Thank you,
Doctoral Research Committee
            `;

            // Send email notification

            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: env.BPHCERP_EMAIL,
                        pass: env.BPHCERP_PASSWORD,
                    },
                });

                await transporter.sendMail(
                    {
                        from: env.BPHCERP_EMAIL,
                        to: supervisorEmail,
                        subject:
                            "Request for PhD Qualifying Exam Examiner Suggestions",
                        text: emailBody,
                    },
                    (error, info) => {
                        if (error) {
                            console.error("Error sending email:", error);
                        } else {
                            console.log("Email sent:", info.response);
                        }
                    }
                );
            } catch (e) {
                throw new HttpError(
                    HttpCode.INTERNAL_SERVER_ERROR,
                    "Notification failed: error sending email",
                    (e as Error)?.message
                );
            }

            res.status(200).json({ success: true });
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
