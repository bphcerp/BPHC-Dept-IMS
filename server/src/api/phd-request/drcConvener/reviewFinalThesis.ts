import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { phdRequestSchemas, modules } from "lib";
import { HttpError, HttpCode } from "@/config/errors.ts";
import {
    phdRequests,
    phdRequestReviews,
    phdRequestDrcAssignments,
} from "@/config/db/schema/phdRequest.ts";
import { createTodos, completeTodo } from "@/lib/todos/index.ts";
import { eq, and } from "drizzle-orm";
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";
import { phdRequestStatuses } from "../../../../../lib/src/schemas/PhdRequest.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess("phd-request:drc-convener:review"),
    asyncHandler(async (req, res) => {
        const requestId = parseInt(req.params.id);
        const convenerEmail = req.user!.email;
        const body = phdRequestSchemas.finalThesisReviewerSchema.parse(
            req.body
        );

        await db.transaction(async (tx) => {
            const validStatuses: (typeof phdRequestStatuses)[number][] = [
                "supervisor_review_final_thesis",
                "drc_convener_review",
                "drc_member_review",
            ];

            const request = await tx.query.phdRequests.findFirst({
                where: and(
                    eq(phdRequests.id, requestId),
                    eq(phdRequests.requestType, "final_thesis_submission")
                ),
                with: { student: true, supervisor: true },
            });

            if (!request) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Final thesis request not found."
                );
            }

            if (!validStatuses.includes(request.status)) {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Request is not in a valid state for DRC convener review."
                );
            }

            await tx.insert(phdRequestReviews).values({
                requestId,
                reviewerEmail: convenerEmail,
                reviewerRole: "DRC_CONVENER",
                approved: body.action !== "revert",
                comments: body.comments,
            });

            // Clear todos for current and bypassed steps
            const eventsToClear: string[] = [];
            eventsToClear.push(`phd-request:drc-convener-review:${requestId}`);

            if (request.status === "supervisor_review_final_thesis") {
                eventsToClear.push(
                    `phd-request:supervisor-review-final-thesis:${requestId}`
                );
            }
            if (request.status === "drc_member_review") {
                eventsToClear.push(
                    `phd-request:drc-member-review:${requestId}`
                );
            }

            await completeTodo(
                {
                    module: modules[2],
                    completionEvent: eventsToClear,
                },
                tx
            );

            if (body.action === "revert") {
                const todosToCreate = [];
                const emailsToSend = [];
                const targetStatus = "student_review";

                todosToCreate.push({
                    assignedTo: request.studentEmail,
                    createdBy: convenerEmail,
                    title: `Action Required: Final Thesis Reverted by DRC Convener`,
                    description: `The final thesis submission was reverted. Comments: ${body.comments}`,
                    module: modules[2],
                    completionEvent: `phd-request:student-resubmit-final-thesis:${requestId}`,
                    link: `/phd/requests/${requestId}`,
                });
                emailsToSend.push({
                    to: request.studentEmail,
                    subject: `Final Thesis Reverted by DRC Convener`,
                    text: `Dear Student,\n\nThe final thesis submission was reverted by the DRC Convener.\nComments: ${body.comments}\nPlease take necessary action here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                });

                await tx
                    .update(phdRequests)
                    .set({ status: targetStatus })
                    .where(eq(phdRequests.id, requestId));

                if (todosToCreate.length > 0)
                    await createTodos(todosToCreate, tx);
                if (emailsToSend.length > 0) await sendBulkEmails(emailsToSend);
            } else if (body.action === "forward_to_drc") {
                await tx
                    .update(phdRequests)
                    .set({ status: "drc_member_review" })
                    .where(eq(phdRequests.id, requestId));

                await tx
                    .delete(phdRequestDrcAssignments)
                    .where(eq(phdRequestDrcAssignments.requestId, requestId));
                await tx.insert(phdRequestDrcAssignments).values(
                    body.assignedDrcMembers.map((email) => ({
                        requestId,
                        drcMemberEmail: email,
                    }))
                );
                await createTodos(
                    body.assignedDrcMembers.map((email) => ({
                        assignedTo: email,
                        createdBy: convenerEmail,
                        title: `Final Thesis Review for ${request.student.name}`,
                        description:
                            "Please review the assigned final thesis submission.",
                        module: modules[2],
                        completionEvent: `phd-request:drc-member-review:${requestId}`,
                        link: `/phd/requests/${requestId}`,
                    })),
                    tx
                );
                await sendBulkEmails(
                    body.assignedDrcMembers.map((email) => ({
                        to: email,
                        subject: `Final Thesis Review for ${request.student.name}`,
                        text: `Dear DRC Member,\n\nYou have been assigned to review a PhD request for '${request.student.name}'.\n\nPlease review the request here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                    }))
                );
            } else if (body.action === "approve") {
                await tx
                    .update(phdRequests)
                    .set({ status: "hod_review" })
                    .where(eq(phdRequests.id, requestId));

                const hods = await getUsersWithPermission(
                    "phd-request:hod:view",
                    tx
                );
                if (hods.length > 0) {
                    await createTodos(
                        hods.map((hod) => ({
                            assignedTo: hod.email,
                            createdBy: convenerEmail,
                            title: `Final Thesis Approval for ${request.student.name}`,
                            description: `A final thesis submission is awaiting your final approval.`,
                            module: modules[2],
                            completionEvent: `phd-request:hod-review:${requestId}`,
                            link: `/phd/requests/${requestId}`,
                        })),
                        tx
                    );
                    await sendBulkEmails(
                        hods.map((hod) => ({
                            to: hod.email,
                            subject: `Final Thesis Approval for ${request.student.name}`,
                            text: `Dear HOD,\n\nA final thesis submission for '${request.student.name}' is awaiting your final approval.\n\nPlease review it here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                        }))
                    );
                }
            }
        });

        res.status(200).json({
            success: true,
            message: "Action processed successfully.",
        });
    })
);

export default router;
