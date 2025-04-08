import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { handoutSchemas } from "lib";
import { assert } from "console";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import env from "@/config/environment.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        try {
            assert(req.user);
            const parsed = handoutSchemas.finalDecisionBodySchema.parse(
                req.body
            );

            const handout = await db.query.courseHandoutRequests.findFirst({
                where: (handout, { eq }) => eq(handout.id, Number(parsed.id)),
            });

            const result = await db
                .update(courseHandoutRequests)
                .set({
                    status: parsed.status,
                    comments: parsed.comments,
                })
                .where(eq(courseHandoutRequests.id, Number(parsed.id)))
                .returning();

            if (!result.length) {
                return next(
                    new HttpError(HttpCode.NOT_FOUND, "Handout Not Found")
                );
            }
            /*
            if (parsed.status === "rejected"){
                await db.insert(courseHandoutRequests).values({
                    courseCode: handout.courseCode,
                    courseName: handout.courseName,
                    icEmail: handout.icEmail,
                    reviewerEmail: handout.reviewerEmail,
                    category: handout.category,
                    previousSubmissionId: Number(parsed.id),
                    submittedOn: new Date(),
                });
            }
            */ 
            if (env.PROD && parsed.status === "rejected") {
                try {
                    await db.insert(courseHandoutRequests).values({
                        courseCode: handout.courseCode,
                        courseName: handout.courseName,
                        icEmail: handout.icEmail,
                        reviewerEmail: handout.reviewerEmail,
                        category: handout.category,
                        previousSubmissionId: Number(parsed.id),
                        submittedOn: new Date(),
                    });
                    const transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                            user: env.BPHCERP_EMAIL,
                            pass: env.BPHCERP_PASSWORD,
                        },
                    });
                    await transporter.sendMail({
                        from: env.BPHCERP_EMAIL,
                        to: handout?.icEmail,
                        subject: "Handout Rejection",
                        text: `Your handout verification request for course code ${handout?.courseCode} has been rejected by ${req.user?.email}. Please visit the EEE Erp Portal for more details. Website link: ${env.FRONTEND_URL}`,
                    });
                } catch (e) {
                    throw new HttpError(
                        HttpCode.INTERNAL_SERVER_ERROR,
                        "Failed: error sending rejection email",
                        (e as Error)?.message
                    );
                }
            }

            res.status(200).json({
                success: true,
                message: "Handout review updated",
                data: result[0],
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