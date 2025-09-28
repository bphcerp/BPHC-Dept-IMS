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
                approved: body.action !== "revert",
                comments: body.comments || `Action: ${body.action}`,
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
                            createdBy: convenerEmail,
                            title: `Action Required: Final Thesis Reverted by DRC Convener`,
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
                        subject: `Final Thesis Reverted by DRC Convener`,
                        text: `Dear ${targetRole},\n\nThe final thesis submission was reverted by the DRC Convener.\nComments: ${body.comments}\nPlease take necessary action here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                    },
                ]);
            } else if (body.action === "forward_to_drc") {
                // Same logic as generic review
                await tx
                    .update(phdRequests)
                    .set({ status: "drc_member_review" })
                    .where(eq(phdRequests.id, requestId));
                await tx
                    .delete(phdRequestDrcAssignments)
                    .where(eq(phdRequestDrcAssignments.requestId, requestId));
                await tx
                    .insert(phdRequestDrcAssignments)
                    .values(
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
                // Forward to HOD
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
