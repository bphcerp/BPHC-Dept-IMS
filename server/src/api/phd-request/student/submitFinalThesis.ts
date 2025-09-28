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
import { users } from "@/config/db/schema/admin.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";

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
        const { comments } = phdRequestSchemas.studentFinalThesisSchema.parse(
            req.body
        );
        const studentEmail = req.user!.email;
        const uploadedFiles = req.files as Express.Multer.File[];

        if (!uploadedFiles || uploadedFiles.length < 1) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "At least one document for final thesis submission is required."
            );
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

            const fileInserts = uploadedFiles.map((file) => ({
                userEmail: studentEmail,
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
                requestId: requestId,
                fileId: file.id,
                uploadedByEmail: studentEmail,
                documentType: "final_thesis_student_document",
                isPrivate: false,
            }));
            await tx.insert(phdRequestDocuments).values(documentInserts);

            if (comments && comments.trim()) {
                await tx.insert(phdRequestReviews).values({
                    requestId,
                    reviewerEmail: studentEmail,
                    approved: true,
                    comments: `Student submission comments: ${comments}`,
                    status_at_review: request.status,
                });
            }

            await tx
                .update(phdRequests)
                .set({ status: "supervisor_review_final_thesis" })
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
        });

        res.status(200).json({
            success: true,
            message: "Final thesis documents submitted for supervisor review.",
        });
    })
);

export default router;
