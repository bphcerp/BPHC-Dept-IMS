import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import express from "express";
import db from "@/config/db/index.ts";
import { pdfUpload } from "@/config/multer.ts";
import { phdRequestSchemas, modules } from "lib";
import { HttpError, HttpCode } from "@/config/errors.ts";
import {
    phdRequests,
    phdRequestDocuments,
    phdRequestReviews,
} from "@/config/db/schema/phdRequest.ts";
import { files } from "@/config/db/schema/form.ts";
import { createTodos, completeTodo } from "@/lib/todos/index.ts";
import { eq, and } from "drizzle-orm";
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    pdfUpload.array("documents", 2),
    asyncHandler(async (req, res) => {
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid request ID.");
        }
        const { comments, action } =
            phdRequestSchemas.supervisorFinalThesisReviewSchema.parse(req.body);
        const supervisorEmail = req.user!.email;
        const uploadedFiles = req.files as Express.Multer.File[];

        await db.transaction(async (tx) => {
            const request = await tx.query.phdRequests.findFirst({
                where: and(
                    eq(phdRequests.id, requestId),
                    eq(phdRequests.supervisorEmail, supervisorEmail),
                    eq(phdRequests.status, "supervisor_review_final_thesis")
                ),
                with: { student: true },
            });

            if (!request) {
                throw new HttpError(
                    HttpCode.NOT_FOUND,
                    "Request not found or not awaiting your review."
                );
            }

            await completeTodo(
                {
                    module: modules[2],
                    completionEvent: `phd-request:supervisor-review-final-thesis:${requestId}`,
                    assignedTo: supervisorEmail,
                },
                tx
            );

            if (action === "approve") {
                if (!uploadedFiles || uploadedFiles.length < 2) {
                    throw new HttpError(
                        HttpCode.BAD_REQUEST,
                        "Supervisor report and final examination panel documents are required for approval."
                    );
                }

                const fileInserts = uploadedFiles.map((file) => ({
                    userEmail: supervisorEmail,
                    filePath: file.path,
                    originalName: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    fieldName: file.fieldname,
                    module: modules[2],
                }));
                const insertedFiles = await tx
                    .insert(files)
                    .values(fileInserts)
                    .returning();

                const documentInserts = insertedFiles.map((file) => ({
                    requestId,
                    fileId: file.id,
                    uploadedByEmail: supervisorEmail,
                    documentType: "final_thesis_supervisor_document",
                    isPrivate: true,
                }));
                await tx.insert(phdRequestDocuments).values(documentInserts);

                await tx.insert(phdRequestReviews).values({
                    requestId,
                    reviewerEmail: supervisorEmail,
                    approved: true,
                    comments: comments || "Approved by Supervisor",
                    status_at_review: request.status,
                });

                await tx
                    .update(phdRequests)
                    .set({ status: "drc_convener_review" })
                    .where(eq(phdRequests.id, requestId));

                const drcConveners = await getUsersWithPermission(
                    "phd-request:drc-convener:view",
                    tx
                );
                if (drcConveners.length > 0) {
                    const todos = drcConveners.map((convener) => ({
                        assignedTo: convener.email,
                        createdBy: supervisorEmail,
                        title: `Final Thesis review for ${request.student.name}`,
                        description: `The final thesis submission for ${request.student.name} has been approved by the supervisor and requires DRC review.`,
                        module: modules[2],
                        completionEvent: `phd-request:drc-convener-review:${requestId}`,
                        link: `/phd/requests/${requestId}`,
                    }));
                    await createTodos(todos, tx);
                    await sendBulkEmails(
                        drcConveners.map((convener) => ({
                            to: convener.email,
                            subject: `Final Thesis review for ${request.student.name}`,
                            text: `Dear DRC Convener,\n\nThe final thesis submission for ${request.student.name} has been approved by the supervisor and requires DRC review.\n\nPlease review it here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                        }))
                    );
                }
            } else {
                // Revert
                await tx.insert(phdRequestReviews).values({
                    requestId,
                    reviewerEmail: supervisorEmail,
                    approved: false,
                    comments: comments || "Reverted by Supervisor",
                    status_at_review: request.status,
                });

                await tx
                    .update(phdRequests)
                    .set({ status: "student_review" })
                    .where(eq(phdRequests.id, requestId));

                const todos = [
                    {
                        assignedTo: request.studentEmail,
                        createdBy: supervisorEmail,
                        title: `Action Required: Final Thesis Reverted`,
                        description: `Your final thesis submission has been reverted by your supervisor. Please review the comments and resubmit. Comments: ${comments}`,
                        module: modules[2],
                        completionEvent: `phd-request:student-resubmit-final-thesis:${requestId}`,
                        link: `/phd/requests/${requestId}`,
                    },
                ];
                await createTodos(todos, tx);
                await sendBulkEmails([
                    {
                        to: request.studentEmail,
                        subject:
                            "Action Required: Final Thesis Submission Reverted",
                        text: `Dear Student,\n\nYour final thesis submission has been reverted by your supervisor. Please review the comments, make the necessary corrections, and resubmit.\n\nComments: ${comments}\n\nView the request here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                    },
                ]);
            }
        });

        res.status(200).json({
            success: true,
            message: `Action '${action}' processed successfully.`,
        });
    })
);

export default router;
