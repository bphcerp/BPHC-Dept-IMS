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
import { phd } from "@/config/db/schema/admin.ts";
import {
    createTodos,
    completeTodo,
    createNotifications,
} from "@/lib/todos/index.ts";
import { eq, and } from "drizzle-orm";
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";

const router = express.Router();

export default router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid request ID.");
        }
        const { approved, comments } = phdRequestSchemas.reviewerSchema.parse(
            req.body
        );
        const hodEmail = req.user!.email;

        await db.transaction(async (tx) => {
            const request = await tx.query.phdRequests.findFirst({
                where: and(
                    eq(phdRequests.id, requestId),
                    eq(phdRequests.status, "hod_review")
                ),
                with: { student: true, supervisor: true },
            });

            if (!request) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Request not found or not awaiting HOD review."
                );
            }

            await tx.insert(phdRequestReviews).values({
                requestId,
                reviewerEmail: hodEmail,
                reviewerRole: "HOD",
                approved,
                comments,
                status_at_review: request.status,
            });

            await completeTodo(
                {
                    module: modules[2],
                    completionEvent: `phd-request:hod-review:${requestId}`,
                    assignedTo: hodEmail,
                },
                tx
            );

            if (approved) {
                await tx
                    .update(phdRequests)
                    .set({ status: "completed" })
                    .where(eq(phdRequests.id, requestId));

                let nextStatus: string | undefined = undefined;
                switch (request.requestType) {
                    case "pre_submission":
                        nextStatus =
                            "Pre-Submission Completed, Awaiting Draft Notice Request";
                        break;
                    case "draft_notice":
                        nextStatus =
                            "Draft Notice Completed, Awaiting Pre-Thesis Submission";
                        break;
                    case "pre_thesis_submission":
                        nextStatus =
                            "Pre-Thesis Submission Completed, Awaiting Final Thesis Submission";
                        break;
                }

                if (nextStatus) {
                    await tx
                        .update(phd)
                        .set({ currentStatus: nextStatus })
                        .where(eq(phd.email, request.studentEmail));
                }

                const notificationsToCreate = [
                    {
                        userEmail: request.studentEmail,
                        title: `Your PhD Request has been Approved`,
                        content: `Your '${request.requestType.replace(
                            /_/g,
                            " "
                        )}' request has been approved by the HOD.`,
                        module: modules[2],
                    },
                    {
                        userEmail: request.supervisorEmail,
                        title: `PhD Request for ${request.student.name} Approved`,
                        content: `The '${request.requestType.replace(
                            /_/g,
                            " "
                        )}' request for your student has been approved by the HOD.`,
                        module: modules[2],
                    },
                ];
                await createNotifications(notificationsToCreate, false, tx);

                await sendBulkEmails([
                    {
                        to: request.studentEmail,
                        subject: `Your PhD Request has been Approved`,
                        text: `Dear ${
                            request.student.name
                        },\n\nYour PhD request for '${request.requestType.replace(
                            /_/g,
                            " "
                        )}' has been approved by the HOD.`,
                    },
                    {
                        to: request.supervisorEmail,
                        subject: `PhD Request for ${request.student.name} Approved`,
                        text: `Dear ${
                            request.supervisor.name
                        },\n\nThe PhD request for your student, ${
                            request.student.name
                        }, for '${request.requestType.replace(
                            /_/g,
                            " "
                        )}' has been approved by the HOD.`,
                    },
                ]);
            } else {
                await tx
                    .update(phdRequests)
                    .set({ status: "reverted_by_hod" })
                    .where(eq(phdRequests.id, requestId));

                await createTodos(
                    [
                        {
                            assignedTo: request.supervisorEmail,
                            createdBy: hodEmail,
                            title: `PhD Request Reverted by HOD`,
                            description: `Your request for '${request.student.name}' has been reverted by the HOD. Comments: ${comments}`,
                            module: modules[2],
                            completionEvent: `phd-request:supervisor-resubmit:${requestId}`,
                            link: `/phd/requests/${requestId}`,
                        },
                    ],
                    tx
                );

                await sendBulkEmails([
                    {
                        to: request.supervisorEmail,
                        subject: `PhD Request Reverted by HOD`,
                        text: `Dear ${
                            request.supervisor.name
                        },\n\nYour PhD request for '${
                            request.student.name
                        }' has been reverted by the HOD.\n\nComments: ${comments}\n\nPlease review and resubmit here: ${
                            environment.FRONTEND_URL
                        }/phd/requests/${requestId}`,
                    },
                ]);
            }
        });
        res.status(200).json({
            success: true,
            message: "HOD review submitted successfully.",
        });
    })
);
