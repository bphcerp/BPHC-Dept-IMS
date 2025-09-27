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

const router = express.Router();

router.post(
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
        const reviewerEmail = req.user!.email;

        await db.transaction(async (tx) => {
            const assignment =
                await tx.query.phdRequestDrcAssignments.findFirst({
                    where: and(
                        eq(phdRequestDrcAssignments.requestId, requestId),
                        eq(
                            phdRequestDrcAssignments.drcMemberEmail,
                            reviewerEmail
                        ),
                        eq(phdRequestDrcAssignments.status, "pending")
                    ),
                });

            if (!assignment) {
                throw new HttpError(
                    HttpCode.FORBIDDEN,
                    "You are not assigned to review this request or have already reviewed it."
                );
            }

            await tx
                .insert(phdRequestReviews)
                .values({ requestId, reviewerEmail, approved, comments });

            await tx
                .update(phdRequestDrcAssignments)
                .set({ status: approved ? "approved" : "reverted" })
                .where(eq(phdRequestDrcAssignments.id, assignment.id));

            await completeTodo(
                {
                    module: modules[2],
                    completionEvent: `phd-request:drc-member-review:${requestId}`,
                    assignedTo: reviewerEmail,
                },
                tx
            );

            if (!approved) {
                const request = await tx.query.phdRequests.findFirst({
                    where: eq(phdRequests.id, requestId),
                    with: { student: true },
                });

                await tx
                    .update(phdRequests)
                    .set({ status: "reverted_by_drc_member" })
                    .where(eq(phdRequests.id, requestId));

                if (request) {
                    await createTodos(
                        [
                            {
                                assignedTo: request.supervisorEmail,
                                createdBy: reviewerEmail,
                                title: `PhD Request Reverted by DRC Member`,
                                description: `Your request for '${request.student.name}' was reverted. Comments: ${comments}`,
                                module: modules[2],
                                completionEvent: `phd-request:supervisor-resubmit:${requestId}`,
                                link: `/phd/supervisor/requests/${requestId}`,
                            },
                        ],
                        tx
                    );
                }
            } else {
                const allAssignments =
                    await tx.query.phdRequestDrcAssignments.findMany({
                        where: eq(
                            phdRequestDrcAssignments.requestId,
                            requestId
                        ),
                    });

                const allApproved = allAssignments.every(
                    (a) => a.status === "approved"
                );

                if (allApproved) {
                    await tx
                        .update(phdRequests)
                        .set({ status: "drc_convener_review" })
                        .where(eq(phdRequests.id, requestId));

                    const drcConveners = await getUsersWithPermission(
                        "phd-request:drc-convener:view",
                        tx
                    );

                    if (drcConveners.length > 0) {
                        await createTodos(
                            drcConveners.map((c) => ({
                                assignedTo: c.email,
                                createdBy: "system",
                                title: `PhD Request Ready for Final DRC Approval`,
                                description: `All assigned DRC members have approved the request. Please provide final approval.`,
                                module: modules[2],
                                completionEvent: `phd-request:drc-convener-review:${requestId}`,
                                link: `/phd/drc-convener/requests/${requestId}`,
                            })),
                            tx
                        );
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            message: "Review submitted successfully.",
        });
    })
);

export default router;
