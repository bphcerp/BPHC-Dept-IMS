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
import { eq } from "drizzle-orm";
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid request ID.");
        }

        const body = phdRequestSchemas.drcConvenerReviewSchema.parse(req.body);
        const convenerEmail = req.user!.email;

        await db.transaction(async (tx) => {
            const request = await tx.query.phdRequests.findFirst({
                where: eq(phdRequests.id, requestId),
                with: { student: true, supervisor: true },
            });
            if (!request)
                throw new HttpError(HttpCode.NOT_FOUND, "Request not found.");

            await tx.insert(phdRequestReviews).values({
                requestId,
                reviewerEmail: convenerEmail,
                approved: body.action !== "revert",
                comments: body.comments || `Action: ${body.action}`,
                status_at_review: request.status,
            });

            await completeTodo(
                {
                    module: modules[2],
                    completionEvent: `phd-request:drc-convener-review:${requestId}`,
                    assignedTo: convenerEmail,
                },
                tx
            );

            switch (body.action) {
                case "revert":
                    await tx
                        .update(phdRequests)
                        .set({ status: "reverted_by_drc_convener" })
                        .where(eq(phdRequests.id, requestId));

                    const revertTodos = [
                        {
                            assignedTo: request.supervisorEmail,
                            createdBy: convenerEmail,
                            title: `PhD Request Reverted by DRC Convener`,
                            description: `Your request for '${request.student.name}' has been reverted. Comments: ${body.comments}`,
                            module: modules[2],
                            completionEvent: `phd-request:supervisor-resubmit:${requestId}`,
                            link: `/phd/requests/${requestId}`,
                        },
                    ];
                    await createTodos(revertTodos, tx);
                    await sendBulkEmails([
                        {
                            to: request.supervisorEmail,
                            subject: `PhD Request Reverted by DRC Convener`,
                            text: `Dear ${request.supervisor.name},\n\nYour PhD request for '${request.student.name}' has been reverted by the DRC Convener.\n\nComments: ${body.comments}\n\nPlease review and resubmit here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                        },
                    ]);
                    break;

                case "forward_to_drc":
                    if (
                        !body.assignedDrcMembers ||
                        body.assignedDrcMembers.length === 0
                    ) {
                        throw new HttpError(
                            HttpCode.BAD_REQUEST,
                            "At least one DRC member must be selected to forward."
                        );
                    }
                    await tx
                        .update(phdRequests)
                        .set({ status: "drc_member_review" })
                        .where(eq(phdRequests.id, requestId));

                    await tx
                        .delete(phdRequestDrcAssignments)
                        .where(
                            eq(phdRequestDrcAssignments.requestId, requestId)
                        );

                    await tx.insert(phdRequestDrcAssignments).values(
                        body.assignedDrcMembers.map((email) => ({
                            requestId,
                            drcMemberEmail: email,
                        }))
                    );

                    const drcTodos = body.assignedDrcMembers.map((email) => ({
                        assignedTo: email,
                        createdBy: convenerEmail,
                        title: `PhD Request Review for ${request.student.name}`,
                        description: "Please review the assigned PhD request.",
                        module: modules[2],
                        completionEvent: `phd-request:drc-member-review:${requestId}`,
                        link: `/phd/requests/${requestId}`,
                    }));
                    await createTodos(drcTodos, tx);
                    await sendBulkEmails(
                        body.assignedDrcMembers.map((email) => ({
                            to: email,
                            subject: `PhD Request Review for ${request.student.name}`,
                            text: `Dear DRC Member,\n\nYou have been assigned to review a PhD request for '${request.student.name}'.\n\nPlease review the request here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                        }))
                    );
                    break;

                case "forward_to_hod":
                case "approve":
                    await tx
                        .update(phdRequests)
                        .set({ status: "hod_review" })
                        .where(eq(phdRequests.id, requestId));

                    const hods = await getUsersWithPermission(
                        "phd-request:hod:view",
                        tx
                    );
                    if (hods.length > 0) {
                        const hodTodos = hods.map((hod) => ({
                            assignedTo: hod.email,
                            createdBy: convenerEmail,
                            title: `PhD Request Approval for ${request.student.name}`,
                            description: `A PhD request is awaiting your final approval.`,
                            module: modules[2],
                            completionEvent: `phd-request:hod-review:${requestId}`,
                            link: `/phd/requests/${requestId}`,
                        }));
                        await createTodos(hodTodos, tx);
                        await sendBulkEmails(
                            hods.map((hod) => ({
                                to: hod.email,
                                subject: `PhD Request Approval for ${request.student.name}`,
                                text: `Dear HOD,\n\nA PhD request for '${request.student.name}' is awaiting your final approval.\n\nPlease review it here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                            }))
                        );
                    }
                    break;
            }
        });
        res.status(200).json({
            success: true,
            message: `Request action '${body.action}' processed successfully.`,
        });
    })
);

export default router;
