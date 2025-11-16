import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { phdRequestSchemas, modules } from "lib";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { phdRequests } from "@/config/db/schema/phdRequest.ts";
import { createTodos } from "@/lib/todos/index.ts";
import { eq, and, notInArray } from "drizzle-orm";
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";

const router = express.Router();

const nonEditableStatuses: (typeof phdRequestSchemas.phdRequestStatuses)[number][] =
    [
        "completed",
        "pending_edit_approval",
        "reverted_by_drc_convener",
        "reverted_by_drc_member",
        "reverted_by_hod",
        "student_review",
    ];

router.post(
    "/:id",
    checkAccess("phd-request:supervisor:create"),
    asyncHandler(async (req, res) => {
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid request ID.");
        }
        const supervisorEmail = req.user!.email;

        await db.transaction(async (tx) => {
            const request = await tx.query.phdRequests.findFirst({
                where: and(
                    eq(phdRequests.id, requestId),
                    eq(phdRequests.supervisorEmail, supervisorEmail),
                    notInArray(phdRequests.status, nonEditableStatuses)
                ),
                with: {
                    student: { columns: { name: true } },
                },
            });

            if (!request) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Request not found or it is not in an editable state."
                );
            }

            await tx
                .update(phdRequests)
                .set({
                    status: "pending_edit_approval",
                    status_before_edit_request: request.status,
                })
                .where(eq(phdRequests.id, requestId));

            const drcConveners = await getUsersWithPermission(
                "phd-request:drc-convener:review",
                tx
            );
            if (drcConveners.length > 0) {
                const link = `${environment.FRONTEND_URL}/phd/requests/${requestId}`;
                const todos = drcConveners.map((convener) => ({
                    assignedTo: convener.email,
                    createdBy: supervisorEmail,
                    title: `Edit Request for PhD Submission (Student: ${request.student.name})`,
                    description: `The supervisor has requested to edit the '${request.requestType}' submission. Please review and approve or reject the edit request.`,
                    module: modules[2],
                    completionEvent: `phd-request:edit-approval:${requestId}`,
                    link,
                }));
                await createTodos(todos, tx);

                await sendBulkEmails(
                    drcConveners.map((convener) => ({
                        to: convener.email,
                        subject: `PhD Request Edit Approval Needed`,
                        text: `Dear DRC Convener,\n\nA supervisor has requested to edit a '${request.requestType}' submission for ${request.student.name}. Please log in to the portal to approve or reject this request.\n\n${link}`,
                    }))
                );
            }
        });

        res.status(200).json({
            success: true,
            message: "Edit request submitted to DRC Convener.",
        });
    })
);

export default router;
