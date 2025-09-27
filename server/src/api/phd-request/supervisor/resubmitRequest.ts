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
import { eq, and, desc } from "drizzle-orm";

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

            const lastReview = await tx.query.phdRequestReviews.findFirst({
                where: eq(phdRequestReviews.requestId, requestId),
                orderBy: [desc(phdRequestReviews.createdAt)],
            });

            if (!lastReview) {
                throw new HttpError(
                    HttpCode.INTERNAL_SERVER_ERROR,
                    "Could not find the reverting review."
                );
            }

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
                await createTodos(
                    drcConveners.map((convener) => ({
                        assignedTo: convener.email,
                        createdBy: supervisorEmail,
                        title: `Resubmitted PhD Request from ${request.student.name || request.studentEmail}`,
                        description: `A previously reverted '${request.requestType.replace(/_/g, " ")}' request has been resubmitted.`,
                        module: modules[2],
                        completionEvent: `phd-request:drc-convener-review:${requestId}`,
                        link: `/phd/drc-convener/requests/${requestId}`,
                    })),
                    tx
                );
            }
        });

        res.status(200).json({
            success: true,
            message: "Request resubmitted successfully.",
        });
    })
);

export default router;
