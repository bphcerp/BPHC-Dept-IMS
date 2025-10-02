// server/src/api/phd-request/drcConvener/reviewFinalThesis.ts
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
    checkAccess("phd-request:drc-convener:review"),
    asyncHandler(async (req, res) => {
        const requestId = parseInt(req.params.id);
        const convenerEmail = req.user!.email;
        const body = phdRequestSchemas.finalThesisReviewerSchema.parse(
            req.body
        );

        await db.transaction(async (tx) => {
            const request = await tx.query.phdRequests.findFirst({
                where: eq(phdRequests.id, requestId),
                with: { student: true, supervisor: true },
            });

            if (!request || request.requestType !== "final_thesis_submission") {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Final thesis request not found."
                );
            }

            await tx.insert(phdRequestReviews).values({
                requestId,
                reviewerEmail: convenerEmail,
                reviewerRole: "DRC_CONVENER",
                approved: body.action !== "revert",
                comments: body.comments,
                studentComments:
                    body.action === "revert" ? body.studentComments : null,
                supervisorComments:
                    body.action === "revert" ? body.supervisorComments : null,
            });

            await completeTodo(
                {
                    module: modules[2],
                    completionEvent: `phd-request:drc-convener-review:${requestId}`,
                    assignedTo: convenerEmail,
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
                        createdBy: convenerEmail,
                        title: `Action Required: Final Thesis Reverted by DRC Convener`,
                        description: `The final thesis submission was reverted. Comments: ${body.studentComments}`,
                        module: modules[2],
                        completionEvent: `phd-request:student-resubmit-final-thesis:${requestId}`,
                        link: `/phd/requests/${requestId}`,
                    });
                    emailsToSend.push({
                        to: request.studentEmail,
                        subject: `Final Thesis Reverted by DRC Convener`,
                        text: `Dear Student,\n\nThe final thesis submission was reverted by the DRC Convener.\nComments: ${body.studentComments}\nPlease take necessary action here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                    });
                }
                if (
                    body.revertTo === "supervisor" 
                ) {
                    todosToCreate.push({
                        assignedTo: request.supervisorEmail,
                        createdBy: convenerEmail,
                        title: `Action Required: Final Thesis Reverted by DRC Convener`,
                        description: `The final thesis submission for ${request.student.name} was reverted. Comments: ${body.supervisorComments}`,
                        module: modules[2],
                        completionEvent: `phd-request:supervisor-resubmit-final-thesis:${requestId}`,
                        link: `/phd/requests/${requestId}`,
                    });
                    emailsToSend.push({
                        to: request.supervisorEmail,
                        subject: `Final Thesis Reverted by DRC Convener`,
                        text: `Dear Supervisor,\n\nThe final thesis submission was reverted by the DRC Convener.\n\nComments for you: ${body.supervisorComments}\nComments for student: ${body.studentComments}\nPlease take necessary action here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                    });
                }

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
