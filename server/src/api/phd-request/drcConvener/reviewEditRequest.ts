import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { phdRequestSchemas, modules } from "lib";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { phdRequests } from "@/config/db/schema/phdRequest.ts";
import { createTodos, completeTodo } from "@/lib/todos/index.ts";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess("phd-request:drc-convener:review"),
    asyncHandler(async (req, res) => {
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid request ID.");
        }
        const { approve, comments } =
            phdRequestSchemas.approveEditRequestSchema.parse(req.body);
        const convenerEmail = req.user!.email;

        await db.transaction(async (tx) => {
            const request = await tx.query.phdRequests.findFirst({
                where: and(
                    eq(phdRequests.id, requestId),
                    eq(phdRequests.status, "pending_edit_approval")
                ),
                with: {
                    student: { columns: { name: true } },
                    supervisor: { columns: { name: true } },
                },
            });

            if (!request) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Edit request not found or not pending approval."
                );
            }
            if (!request.status_before_edit_request) {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Invalid state: Original status not found."
                );
            }

            await completeTodo(
                {
                    module: modules[2],
                    completionEvent: `phd-request:edit-approval:${requestId}`,
                    assignedTo: convenerEmail,
                },
                tx
            );

            if (approve) {
                // Edit Approved: Revert to the correct person
                const newStatus =
                    request.requestType === "final_thesis_submission"
                        ? "student_review"
                        : "reverted_by_drc_convener";

                await tx
                    .update(phdRequests)
                    .set({
                        status: newStatus,
                        status_before_edit_request: null,
                        comments: `Edit request approved by DRC Convener. ${comments || ""}`,
                    })
                    .where(eq(phdRequests.id, requestId));

                const link = `${environment.FRONTEND_URL}/phd/requests/${requestId}`;
                if (newStatus === "student_review") {
                    // Notify Student
                    await createTodos(
                        [
                            {
                                assignedTo: request.studentEmail,
                                createdBy: convenerEmail,
                                title: "Action Required: Your PhD Request is unlocked for editing",
                                description: `Your edit request for '${request.requestType}' has been approved by the DRC Convener. Please make the necessary changes.`,
                                module: modules[2],
                                completionEvent: `phd-request:student-resubmit-final-thesis:${requestId}`,
                                link,
                            },
                        ],
                        tx
                    );
                    await sendEmail({
                        to: request.studentEmail,
                        subject: "PhD Request Unlocked for Editing",
                        text: `Dear ${
                            request.student.name || "Student"
                        },\n\nYour request to edit the '${
                            request.requestType
                        }' submission has been approved by the DRC Convener. Please log in to the portal to make your changes.\n\n${link}`,
                    });
                } else {
                    // Notify Supervisor
                    await createTodos(
                        [
                            {
                                assignedTo: request.supervisorEmail,
                                createdBy: convenerEmail,
                                title: `Action Required: PhD Request for ${request.student.name} is unlocked for editing`,
                                description: `Your edit request for '${request.requestType}' has been approved by the DRC Convener. Please make the necessary changes and resubmit.`,
                                module: modules[2],
                                completionEvent: `phd-request:supervisor-resubmit:${requestId}`,
                                link,
                            },
                        ],
                        tx
                    );
                    await sendEmail({
                        to: request.supervisorEmail,
                        subject: "PhD Request Unlocked for Editing",
                        text: `Dear ${
                            request.supervisor.name || "Supervisor"
                        },\n\nYour request to edit the '${request.requestType}' submission for ${
                            request.student.name
                        } has been approved by the DRC Convener. Please log in to the portal to make changes and resubmit.\n\n${link}`,
                    });
                }
            } else {
                // Edit Rejected: Revert to original status
                await tx
                    .update(phdRequests)
                    .set({
                        status: request.status_before_edit_request,
                        status_before_edit_request: null,
                    })
                    .where(eq(phdRequests.id, requestId));

                await sendEmail({
                    to: request.supervisorEmail,
                    subject: "PhD Request Edit Request Rejected",
                    text: `Dear ${
                        request.supervisor.name || "Supervisor"
                    },\n\nYour request to edit the '${request.requestType}' submission for ${
                        request.student.name
                    } has been rejected by the DRC Convener.\n\nComments: ${
                        comments || "No comments provided."
                    }\n\nThe request will proceed in its original state.`,
                });
            }
        });

        res.status(200).json({
            success: true,
            message: "Action processed successfully.",
        });
    })
);

export default router;
