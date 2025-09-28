import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { phdRequestSchemas, modules } from "lib";
import { HttpError, HttpCode } from "@/config/errors.ts";
import {
    phdRequests,
    phdRequestReviews,
} from "@/config/db/schema/phdRequest.ts";
import {
    createTodos,
    completeTodo,
    createNotifications,
} from "@/lib/todos/index.ts";
import { eq } from "drizzle-orm";
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess("phd-request:hod:review"),
    asyncHandler(async (req, res) => {
        const requestId = parseInt(req.params.id);
        const hodEmail = req.user!.email;
        const body = phdRequestSchemas.hodFinalThesisReviewerSchema.parse(
            req.body
        );

        await db.transaction(async (tx) => {
            const request = await tx.query.phdRequests.findFirst({
                where: eq(phdRequests.id, requestId),
                with: { student: true, supervisor: true },
            });
            if (
                !request ||
                request.requestType !== "final_thesis_submission" ||
                request.status !== "hod_review"
            ) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Final thesis request not found or not awaiting HOD review."
                );
            }

            await tx.insert(phdRequestReviews).values({
                requestId,
                reviewerEmail: hodEmail,
                reviewerRole: "HOD",
                approved: body.action === "approve",
                comments: body.comments || `Action: ${body.action}`,
            });

            await completeTodo(
                {
                    module: modules[2],
                    completionEvent: `phd-request:hod-review:${requestId}`,
                    assignedTo: hodEmail,
                },
                tx
            );

            if (body.action === "revert") {
                const targetStatus =
                    body.revertTo === "student"
                        ? "student_review"
                        : "supervisor_review_final_thesis";
                const targetEmail =
                    body.revertTo === "student"
                        ? request.studentEmail
                        : request.supervisorEmail;
                const targetRole =
                    body.revertTo === "student" ? "Student" : "Supervisor";

                await tx
                    .update(phdRequests)
                    .set({ status: targetStatus })
                    .where(eq(phdRequests.id, requestId));

                await createTodos(
                    [
                        {
                            assignedTo: targetEmail,
                            createdBy: hodEmail,
                            title: `Action Required: Final Thesis Reverted by HOD`,
                            description: `The final thesis submission for ${request.student.name} was reverted. Comments: ${body.comments}`,
                            module: modules[2],
                            completionEvent: `phd-request:${body.revertTo}-resubmit-final-thesis:${requestId}`,
                            link: `/phd/requests/${requestId}`,
                        },
                    ],
                    tx
                );

                await sendBulkEmails([
                    {
                        to: targetEmail,
                        subject: `Final Thesis Reverted by HOD`,
                        text: `Dear ${targetRole},\n\nThe final thesis submission was reverted by the HOD.\nComments: ${body.comments}\nPlease take necessary action here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                    },
                ]);
            } else if (body.action === "approve") {
                await tx
                    .update(phdRequests)
                    .set({ status: "completed" })
                    .where(eq(phdRequests.id, requestId));

                await createNotifications(
                    [
                        {
                            userEmail: request.studentEmail,
                            title: `Your Final Thesis Submission has been Approved`,
                            content: `Your final thesis submission has been approved by the HOD.`,
                            module: modules[2],
                        },
                        {
                            userEmail: request.supervisorEmail,
                            title: `Final Thesis for ${request.student.name} Approved`,
                            content: `The final thesis submission for your student has been approved by the HOD.`,
                            module: modules[2],
                        },
                    ],
                    false,
                    tx
                );

                await sendBulkEmails([
                    {
                        to: request.studentEmail,
                        subject: `Your Final Thesis Submission has been Approved`,
                        text: `Dear ${request.student.name},\n\nYour final thesis submission has been approved by the HOD.`,
                    },
                    {
                        to: request.supervisorEmail,
                        subject: `Final Thesis for ${request.student.name} Approved`,
                        text: `Dear ${request.supervisor.name},\n\nThe final thesis submission for your student, ${request.student.name}, has been approved by the HOD.`,
                    },
                ]);
            }
        });

        res.status(200).json({
            success: true,
            message: "Action processed successfully.",
        });
    })
);

export default router;
