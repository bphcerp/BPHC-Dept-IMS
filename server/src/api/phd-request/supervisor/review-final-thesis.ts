// server/src/api/phd-request/supervisor/review-final-thesis.ts
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
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { eq, and } from "drizzle-orm";
import multer from "multer";

const router = express.Router();

const supervisorDocsUpload = pdfUpload.fields([
    { name: "examiner_list", maxCount: 1 },
    { name: "examiner_info", maxCount: 1 },
]);

router.post(
    "/:id",
    checkAccess(), // Using view permission, can be more specific
    asyncHandler((req, res, next) =>
        supervisorDocsUpload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                throw new HttpError(HttpCode.BAD_REQUEST, err.message);
            }
            next(err);
        })
    ),
    asyncHandler(async (req, res) => {
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid request ID.");
        }

        const { action, comments } =
            phdRequestSchemas.supervisorFinalThesisReviewSchema.parse(req.body);
        const supervisorEmail = req.user!.email;

        await db.transaction(async (tx) => {
            const request = await tx.query.phdRequests.findFirst({
                where: and(
                    eq(phdRequests.id, requestId),
                    eq(phdRequests.supervisorEmail, supervisorEmail)
                ),
                with: { student: true },
            });

            if (!request)
                throw new HttpError(HttpCode.NOT_FOUND, "Request not found.");
            if (request.status !== "supervisor_review_final_thesis") {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Request is not awaiting supervisor review of final thesis."
                );
            }

            // Complete the supervisor's current To-do for this task
            await completeTodo(
                {
                    module: modules[2],
                    completionEvent: `phd-request:supervisor-review-final-thesis:${requestId}`,
                    assignedTo: supervisorEmail,
                },
                tx
            );

            if (action === "revert") {
                await tx
                    .update(phdRequests)
                    .set({ status: "student_review" }) // Send back to student
                    .where(eq(phdRequests.id, requestId));

                await tx.insert(phdRequestReviews).values({
                    requestId,
                    reviewerEmail: supervisorEmail,
                    approved: false,
                    comments: comments || "Reverted by supervisor.",
                });

                await createTodos(
                    [
                        {
                            assignedTo: request.studentEmail,
                            createdBy: supervisorEmail,
                            title: "Action Required: Final Thesis Reverted",
                            description: `Your supervisor has reverted your final thesis submission with comments. Please revise and resubmit. Comments: ${comments}`,
                            module: modules[2],
                            completionEvent: `phd-request:student-resubmit-final-thesis:${requestId}`,
                            link: `/phd/student/requests/${requestId}`,
                        },
                    ],
                    tx
                );
            } else if (action === "approve") {
                const uploadedFiles = req.files as {
                    [fieldname: string]: Express.Multer.File[];
                };
                if (
                    !uploadedFiles?.examiner_list ||
                    !uploadedFiles?.examiner_info
                ) {
                    throw new HttpError(
                        HttpCode.BAD_REQUEST,
                        "Both 'Approved List of Examiners' and 'Format for Information of Examiners' documents are required for approval."
                    );
                }

                const filesToInsert = Object.values(uploadedFiles)
                    .flat()
                    .map((file) => ({
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
                    .values(filesToInsert)
                    .returning();

                const documentInserts = insertedFiles.map((file) => ({
                    requestId: requestId,
                    fileId: file.id,
                    uploadedByEmail: supervisorEmail,
                    documentType: file.fieldName!,
                    isPrivate: true, // These documents are confidential
                }));
                await tx.insert(phdRequestDocuments).values(documentInserts);

                await tx
                    .update(phdRequests)
                    .set({ status: "drc_convener_review" })
                    .where(eq(phdRequests.id, requestId));

                await tx.insert(phdRequestReviews).values({
                    requestId,
                    reviewerEmail: supervisorEmail,
                    approved: true,
                    comments: comments || "Approved by supervisor.",
                });

                const drcConveners = await getUsersWithPermission(
                    "phd-request:drc-convener:view",
                    tx
                );
                if (drcConveners.length > 0) {
                    await createTodos(
                        drcConveners.map((c) => ({
                            assignedTo: c.email,
                            createdBy: supervisorEmail,
                            title: `Final Thesis Submission ready for review: ${request.student.name}`,
                            description:
                                "A final thesis package has been approved by the supervisor and is ready for DRC review.",
                            module: modules[2],
                            completionEvent: `phd-request:drc-convener-review:${requestId}`,
                            link: `/phd/drc-convener/requests/${requestId}`,
                        })),
                        tx
                    );
                }
            }
        });

        res.status(200).json({
            success: true,
            message: `Action '${action}' was successful.`,
        });
    })
);

export default router;
