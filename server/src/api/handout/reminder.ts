import db from "@/config/db/index.ts";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import express from "express";
import { handoutSchemas } from "lib";
import env from "@/config/environment.ts";
import nodemailer from "nodemailer";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import environment from "@/config/environment.ts";
import { createNotifications, createTodos } from "@/lib/todos/index.ts";
import assert from "assert";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const parsed = handoutSchemas.deadlineBodySchema.parse({
            time: new Date((req.body as { time: string }).time),
        });
        const handouts = await db
            .update(courseHandoutRequests)
            .set({ deadline: parsed.time })
            .where(eq(courseHandoutRequests.status, "notsubmitted"))
            .returning();
        for (const handout of handouts) {
            if (handout.icEmail) {
                await createTodos([
                    {
                        module: "Course Handout",
                        title: "Course Handout Submission",
                        description: `Upload handouts for the ${handout.courseName} (Course Code : ${handout.courseCode})`,
                        assignedTo: handout.icEmail,
                        link: "/handout/faculty",
                        completionEvent: `handout submission ${handout.courseCode} by ${handout.icEmail}`,
                        createdBy: req.user.email,
                    },
                ]);

                await createNotifications([
                    {
                        module: "Course Handout",
                        title: "Course Handout Submission",
                        userEmail: handout.icEmail,
                        content: `Upload handouts for the Course ${handout.courseName} (Course Code : ${handout.courseCode})`,
                        link: "/handout/faculty",
                    },
                ]);
            }
        }

        if (env.PROD) {
            for (const handout of handouts) {
                if (!handout.icEmail) continue;
                try {
                    const transporter = nodemailer.createTransport({
                        host: "smtp.gmail.com",
                        port: 587,
                        auth: {
                            user: env.BPHCERP_EMAIL,
                            pass: env.BPHCERP_PASSWORD,
                        },
                    });
                    await transporter.sendMail({
                        from: env.BPHCERP_EMAIL,
                        to: handout.icEmail,
                        subject: "Handout Reminder",
                        text: `You have to submit the handout file for ${handout.courseCode} by ${handout.deadline?.toLocaleString() ?? "(unspecified)"}. Please visit the ${environment.DEPARTMENT_NAME} IMS Erp Portal for more details. Website link: ${env.FRONTEND_URL}`,
                    });
                } catch (e) {
                    next(
                        new HttpError(
                            HttpCode.INTERNAL_SERVER_ERROR,
                            "Failed: error sending rejection email",
                            (e as Error)?.message
                        )
                    );
                }
            }
        }

        res.status(200).json({ success: true });
    })
);

export default router;
