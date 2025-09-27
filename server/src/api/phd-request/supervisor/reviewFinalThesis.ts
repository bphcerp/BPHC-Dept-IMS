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
                // Insert private documents
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
                    isPrivate: true, // Mark as private
                }));
                await tx.insert(phdRequestDocuments).values(documentInserts);

                // Log review and update status
                await tx
                    .insert(phdRequestReviews)
                    .values({
                        requestId,
                        reviewerEmail: supervisorEmail,
                        approved: true,
                        comments: comments || "Approved by Supervisor",
                    });
                await tx
                    .update(phdRequests)
                    .set({ status: "drc_convener_review" })
                    .where(eq(phdRequests.id, requestId));

                // Create To-Do for DRC Convener
                const drcConveners = await getUsersWithPermission(
                    "phd-request:drc-convener:view",
                    tx
                );
                if (drcConveners.length > 0) {
                    await createTodos(
                        drcConveners.map((convener) => ({
                            assignedTo: convener.email,
                            createdBy: supervisorEmail,
                            title: `Final Thesis review for ${request.student.name}`,
                            description: `The final thesis submission for ${request.student.name} has been approved by the supervisor and requires DRC review.`,
                            module: modules[2],
                            completionEvent: `phd-request:drc-convener-review:${requestId}`,
                            link: `/phd/drc-convener/requests/${requestId}`,
                        })),
                        tx
                    );
                }
            } else {
                // action === 'revert'
                await tx
                    .insert(phdRequestReviews)
                    .values({
                        requestId,
                        reviewerEmail: supervisorEmail,
                        approved: false,
                        comments: comments || "Reverted by Supervisor",
                    });
                await tx
                    .update(phdRequests)
                    .set({ status: "student_review" })
                    .where(eq(phdRequests.id, requestId));

                // Create To-Do for Student
                await createTodos(
                    [
                        {
                            assignedTo: request.studentEmail,
                            createdBy: supervisorEmail,
                            title: `Action Required: Final Thesis Reverted`,
                            description: `Your final thesis submission has been reverted by your supervisor. Please review the comments and resubmit. Comments: ${comments}`,
                            module: modules[2],
                            completionEvent: `phd-request:student-resubmit-final-thesis:${requestId}`,
                            link: `/phd/student/requests/${requestId}`,
                        },
                    ],
                    tx
                );
            }
        });

        res.status(200).json({
            success: true,
            message: `Action '${action}' processed successfully.`,
        });
    })
);

export default router;
