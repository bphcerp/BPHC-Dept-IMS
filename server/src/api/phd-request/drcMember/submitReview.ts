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

            // Check if all members have reviewed
            const allAssignments =
                await tx.query.phdRequestDrcAssignments.findMany({
                    where: eq(phdRequestDrcAssignments.requestId, requestId),
                });

            const allReviewed = allAssignments.every(
                (a) => a.status !== "pending"
            );

            // If all members have reviewed, send it back to the convener
            if (allReviewed) {
                await tx
                    .update(phdRequests)
                    .set({ status: "drc_convener_review" })
                    .where(eq(phdRequests.id, requestId));

                const drcConveners = await getUsersWithPermission(
                    "phd-request:drc-convener:view",
                    tx
                );
                if (drcConveners.length > 0) {
                    const studentRequest = await tx.query.phdRequests.findFirst(
                        {
                            where: eq(phdRequests.id, requestId),
                            with: { student: { columns: { name: true } } },
                        }
                    );
                    const studentName =
                        studentRequest?.student.name || "a student";

                    await createTodos(
                        drcConveners.map((c) => ({
                            assignedTo: c.email,
                            createdBy: "system",
                            title: `DRC Review Complete for ${studentName}`,
                            description: `All assigned DRC members have submitted their feedback for the request for ${studentName}. Please provide the final decision.`,
                            module: modules[2],
                            completionEvent: `phd-request:drc-convener-review:${requestId}`,
                            link: `/phd/requests/${requestId}`,
                        })),
                        tx
                    );
                    await sendBulkEmails(
                        drcConveners.map((c) => ({
                            to: c.email,
                            subject: `DRC Review Complete for ${studentName}`,
                            text: `Dear DRC Convener,\n\nAll assigned DRC members have submitted their feedback for the request for student '${studentName}'. Your final decision is now required.\n\nView here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                        }))
                    );
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
