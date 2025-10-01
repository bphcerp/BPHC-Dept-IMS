// server/src/api/phd-request/hod/reviewFinalThesis.ts
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
                comments: body.comments,
                studentComments:
                    body.action === "revert" ? body.studentComments : null,
                supervisorComments:
                    body.action === "revert" ? body.supervisorComments : null,
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
                const todosToCreate = [];
                const emailsToSend = [];
                const targetStatus =
                    body.revertTo === "supervisor"
                        ? "supervisor_review_final_thesis"
                        : "student_review";

                if (body.revertTo === "student" || body.revertTo === "both") {
                    todosToCreate.push({
                        assignedTo: request.studentEmail,
                        createdBy: hodEmail,
                        title: `Action Required: Final Thesis Reverted by HOD`,
                        description: `The final thesis submission was reverted. Comments: ${body.studentComments}`,
                        module: modules[2],
                        completionEvent: `phd-request:student-resubmit-final-thesis:${requestId}`,
                        link: `/phd/requests/${requestId}`,
                    });
                    emailsToSend.push({
                        to: request.studentEmail,
                        subject: `Final Thesis Reverted by HOD`,
                        text: `Dear Student,\n\nThe final thesis submission was reverted by the HOD.\nComments: ${body.studentComments}\nPlease take necessary action here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                    });
                }
                if (
                    body.revertTo === "supervisor" ||
                    body.revertTo === "both"
                ) {
                    todosToCreate.push({
                        assignedTo: request.supervisorEmail,
                        createdBy: hodEmail,
                        title: `Action Required: Final Thesis Reverted by HOD`,
                        description: `The final thesis submission for ${request.student.name} was reverted. Comments: ${body.supervisorComments}`,
                        module: modules[2],
                        completionEvent: `phd-request:supervisor-resubmit-final-thesis:${requestId}`,
                        link: `/phd/requests/${requestId}`,
                    });
                    emailsToSend.push({
                        to: request.supervisorEmail,
                        subject: `Final Thesis Reverted by HOD`,
                        text: `Dear Supervisor,\n\nThe final thesis submission was reverted by the HOD.\n\nComments for you: ${body.supervisorComments}\nComments for student: ${body.studentComments}\nPlease take necessary action here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                    });
                }

                await tx
                    .update(phdRequests)
                    .set({ status: targetStatus })
                    .where(eq(phdRequests.id, requestId));
                if (todosToCreate.length > 0)
                    await createTodos(todosToCreate, tx);
                if (emailsToSend.length > 0) await sendBulkEmails(emailsToSend);
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
