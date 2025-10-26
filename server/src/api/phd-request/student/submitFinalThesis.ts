// server/src/api/phd-request/student/submitFinalThesis.ts
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
import { eq, and, inArray } from "drizzle-orm";
import { users } from "@/config/db/schema/admin.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";
import fs from "fs/promises";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    pdfUpload.array("documents", 12),
    asyncHandler(async (req, res) => {
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid request ID.");
        }
        const { comments, submissionType } =
            phdRequestSchemas.studentFinalThesisSchema.parse(req.body);
        const studentEmail = req.user!.email;
        const uploadedFiles = req.files as Express.Multer.File[];

        if (submissionType === "final") {
            const hasExistingDocs =
                await db.query.phdRequestDocuments.findFirst({
                    where: and(
                        eq(phdRequestDocuments.requestId, requestId),
                        eq(phdRequestDocuments.uploadedByEmail, studentEmail)
                    ),
                });
            if (!uploadedFiles?.length && !hasExistingDocs) {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "At least one document is required for final submission."
                );
            }
        }

        await db.transaction(async (tx) => {
            const request = await tx.query.phdRequests.findFirst({
                where: and(
                    eq(phdRequests.id, requestId),
                    eq(phdRequests.studentEmail, studentEmail)
                ),
                with: { supervisor: true },
            });

            if (!request) {
                throw new HttpError(HttpCode.NOT_FOUND, "Request not found.");
            }
            if (request.status !== "student_review") {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Request is not awaiting student submission."
                );
            }

            // *** FIX: Targeted file replacement logic ***
            if (uploadedFiles && uploadedFiles.length > 0) {
                // Identify which document types are being replaced based on the new uploads.
                const fieldNamesToReplace = uploadedFiles.map(
                    (f) => f.originalname
                ); // originalname is the doc.id from the frontend.

                // Find only the old documents that match the types of the newly uploaded files.
                const oldDocsToDelete =
                    await tx.query.phdRequestDocuments.findMany({
                        where: and(
                            eq(phdRequestDocuments.requestId, requestId),
                            eq(
                                phdRequestDocuments.uploadedByEmail,
                                studentEmail
                            ),
                            inArray(
                                phdRequestDocuments.documentType,
                                fieldNamesToReplace
                            )
                        ),
                        columns: { fileId: true },
                    });

                if (oldDocsToDelete.length > 0) {
                    const oldFileIds = oldDocsToDelete.map((doc) => doc.fileId);
                    const oldFileRecords = await tx
                        .select({ path: files.filePath })
                        .from(files)
                        .where(inArray(files.id, oldFileIds));

                    await tx
                        .delete(phdRequestDocuments)
                        .where(inArray(phdRequestDocuments.fileId, oldFileIds));
                    await tx.delete(files).where(inArray(files.id, oldFileIds));

                    for (const fileRecord of oldFileRecords) {
                        try {
                            await fs.unlink(fileRecord.path);
                        } catch (e) {
                            console.error(
                                `Failed to delete old file: ${fileRecord.path}`,
                                e
                            );
                        }
                    }
                }

                // Insert new files
                const fileInserts = uploadedFiles.map((file) => ({
                    userEmail: studentEmail,
                    filePath: file.path,
                    originalName: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    fieldName: file.fieldname, // 'documents'
                    module: modules[2],
                }));
                const insertedFiles = await tx
                    .insert(files)
                    .values(fileInserts)
                    .returning();
                const documentInserts = insertedFiles.map((file, index) => ({
                    requestId: requestId,
                    fileId: file.id,
                    uploadedByEmail: studentEmail,
                    documentType: uploadedFiles[index].originalname, // Use the doc.id passed from frontend
                    isPrivate: false,
                }));
                await tx.insert(phdRequestDocuments).values(documentInserts);
            }

            // If this is a final submission, change status and notify supervisor
            if (submissionType === "final") {
                await completeTodo(
                    {
                        module: modules[2],
                        completionEvent: `phd-request:student-submit-final-thesis:${requestId}`,
                        assignedTo: studentEmail,
                    },
                    tx
                );

                const user = await tx.query.users.findFirst({
                    where: eq(users.email, studentEmail),
                    columns: { name: true },
                });
                const studentName = user?.name || studentEmail;

                if (comments && comments.trim()) {
                    await tx.insert(phdRequestReviews).values({
                        requestId,
                        reviewerEmail: studentEmail,
                        reviewerRole: "STUDENT",
                        approved: true,
                        comments: `Student submission comments: ${comments}`,
                        status_at_review: request.status,
                    });
                }

                await tx
                    .update(phdRequests)
                    .set({
                        status: "supervisor_review_final_thesis",
                        comments: comments || null,
                    })
                    .where(eq(phdRequests.id, requestId));

                const todos = [
                    {
                        assignedTo: request.supervisorEmail,
                        createdBy: studentEmail,
                        title: `Final Thesis Submitted by ${studentName}`,
                        description: `Please review the final thesis documents submitted by your student.`,
                        module: modules[2],
                        completionEvent: `phd-request:supervisor-review-final-thesis:${requestId}`,
                        link: `/phd/requests/${requestId}`,
                    },
                ];
                await createTodos(todos, tx);

                await sendBulkEmails([
                    {
                        to: request.supervisorEmail,
                        subject: `Final Thesis Submitted by ${studentName}`,
                        text: `Dear ${request.supervisor.name},\n\nYour student, ${studentName}, has submitted their final thesis documents for review.\n\nPlease review the submission here: ${environment.FRONTEND_URL}/phd/requests/${requestId}`,
                    },
                ]);
            } else {
                // If it's a draft, just update the comments on the main request table
                await tx
                    .update(phdRequests)
                    .set({ comments: comments || null })
                    .where(eq(phdRequests.id, requestId));
            }
        });

        res.status(200).json({
            success: true,
            message:
                submissionType === "draft"
                    ? "Draft saved successfully."
                    : "Final thesis documents submitted for supervisor review.",
        });
    })
);

export default router;
