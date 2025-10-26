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
import { eq, and, inArray } from "drizzle-orm";
import { sendBulkEmails } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";
import fs from "fs/promises";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    pdfUpload.array("documents", 5),
    asyncHandler(async (req, res) => {
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId)) {
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid request ID.");
        }
        const { comments } = phdRequestSchemas.createRequestSchema
            .omit({ studentEmail: true, requestType: true })
            .parse(req.body);
        const supervisorEmail = req.user!.email;
        const uploadedFiles = req.files as Express.Multer.File[];
        const oldFilePaths: string[] = [];

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

            const revertableStatuses: (typeof phdRequestSchemas.phdRequestStatuses)[number][] =
                [
                    "reverted_by_drc_convener",
                    "reverted_by_drc_member",
                    "reverted_by_hod",
                ];
            if (!revertableStatuses.includes(request.status)) {
                throw new HttpError(
                    HttpCode.BAD_REQUEST,
                    "This request is not in a state that can be resubmitted."
                );
            }

            if (uploadedFiles && uploadedFiles.length > 0) {
                const oldDocs = await tx.query.phdRequestDocuments.findMany({
                    where: eq(phdRequestDocuments.requestId, requestId),
                    columns: { fileId: true },
                });

                if (oldDocs.length > 0) {
                    const oldFileIds = oldDocs.map((doc) => doc.fileId);
                    if (oldFileIds.length > 0) {
                        const oldFileRecords = await tx
                            .select({ path: files.filePath })
                            .from(files)
                            .where(inArray(files.id, oldFileIds));
                        oldFileRecords.forEach((file) =>
                            oldFilePaths.push(file.path)
                        );

                        await tx
                            .delete(phdRequestDocuments)
                            .where(
                                eq(phdRequestDocuments.requestId, requestId)
                            );
                        await tx
                            .delete(files)
                            .where(inArray(files.id, oldFileIds));
                    }
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
                    requestId: requestId,
                    fileId: file.id,
                    uploadedByEmail: supervisorEmail,
                    documentType: request.requestType,
                    isPrivate: false,
                }));
                await tx.insert(phdRequestDocuments).values(documentInserts);
            }

            await tx.insert(phdRequestReviews).values({
                requestId: requestId,
                reviewerEmail: supervisorEmail,
                reviewerRole: "SUPERVISOR",
                approved: true,
                comments: comments || "Request resubmitted with corrections.",
                status_at_review: request.status,
            });

            await tx
                .update(phdRequests)
                .set({
                    status: "supervisor_submitted",
                    comments: comments,
                })
                .where(eq(phdRequests.id, requestId));

            await completeTodo(
                {
                    module: modules[2],
                    completionEvent: `phd-request:supervisor-resubmit:${requestId}`,
                    assignedTo: supervisorEmail,
                },
                tx
            );

            const drcConveners = await getUsersWithPermission(
                "phd-request:drc-convener:view",
                tx
            );
            if (drcConveners.length > 0) {
                const todos = drcConveners.map((convener) => ({
                    assignedTo: convener.email,
                    createdBy: supervisorEmail,
                    title: `Resubmitted PhD Request from ${request.student.name || request.studentEmail}`,
                    description: `A previously reverted '${request.requestType.replace(
                        /_/g,
                        " "
                    )}' request has been resubmitted.`,
                    module: modules[2],
                    completionEvent: `phd-request:drc-convener-review:${requestId}`,
                    link: `/phd/requests/${requestId}`,
                }));
                await createTodos(todos, tx);
                await sendBulkEmails(
                    drcConveners.map((convener) => ({
                        to: convener.email,
                        subject: `Resubmitted PhD Request from ${request.student.name || request.studentEmail}`,
                        text: `Dear DRC Convener,\n\nA previously reverted '${request.requestType.replace(
                            /_/g,
                            " "
                        )}' request has been resubmitted by the supervisor.\n\nPlease review it here: ${
                            environment.FRONTEND_URL
                        }/phd/requests/${requestId}`,
                    }))
                );
            }
        });

        for (const path of oldFilePaths) {
            try {
                await fs.unlink(path);
            } catch (err) {
                console.error(`Failed to delete old file: ${path}`, err);
            }
        }

        res.status(200).json({
            success: true,
            message: "Request resubmitted successfully.",
        });
    })
);

export default router;
