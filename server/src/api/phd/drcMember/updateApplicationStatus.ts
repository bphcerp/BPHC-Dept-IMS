import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdExamApplications } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import { phdSchemas } from "lib";
import { sendEmail } from "@/lib/common/email.ts";

const router = express.Router();

export default router.patch(
    "/:applicationId",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const applicationId = parseInt(req.params.applicationId);

        if (isNaN(applicationId)) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Invalid application ID")
            );
        }

        const parsed = phdSchemas.updateApplicationStatusDRCSchema.parse(
            req.body
        );

        const { status, comments } = parsed;

        const existingApplication =
            await db.query.phdExamApplications.findFirst({
                where: eq(phdExamApplications.id, applicationId),
                columns: {
                    id: true,
                    status: true,
                },
                with: {
                    student: {
                        columns: {
                            name: true,
                            email: true,
                        },
                        with: {
                            supervisor: {
                                columns: {
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });

        if (!existingApplication) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );
        }

        if (existingApplication.status === "resubmit") {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Cannot update status of applications marked for resubmission"
                )
            );
        }

        await db.transaction(async (tx) => {
            await tx
                .update(phdExamApplications)
                .set({
                    status,
                    comments: comments,
                })
                .where(eq(phdExamApplications.id, applicationId));
            if (status === "resubmit") {
                await sendEmail({
                    from: req.user?.email,
                    to: existingApplication.student.email,
                    subject:
                        "Action Required: Qualifying Exam Application Revisions Needed",
                    html: `<p>Dear ${existingApplication.student.name ?? "Student"},</p><p>The DRC has reviewed your application and requires revisions. Comments: <blockquote>${comments}</blockquote></p><p>Please log in to resubmit.</p>`,
                });
                if (existingApplication.student.supervisor)
                    await sendEmail({
                        from: req.user?.email,
                        to: existingApplication.student.supervisor.email,
                        subject:
                            "Notification: Student's Qualifying Exam Application Requires Revisions",
                        html: `<p>Dear ${existingApplication.student.supervisor?.name ?? "Faculty"},</p><p>This is to inform you that a PhD student under your supervision, ${existingApplication.student.name ?? existingApplication.student.email}, needs to revise their Qualifying Exam application as per DRC's decision. Comments: <blockquote>${comments}</blockquote></p>`,
                    });
            }
        });

        res.status(200).send();
    })
);
